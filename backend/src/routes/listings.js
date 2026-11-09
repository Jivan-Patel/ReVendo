const express = require("express");
const Joi = require("joi");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const imageResize = require("../middleware/imageResize");
const Listing = require("../models/Listing");

const router = express.Router();

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function validateListing(listing) {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255).required(),
    price: Joi.number().min(1).max(100000).required(),
    categoryId: Joi.number().required(),
    condition: Joi.string()
      .valid("Brand New", "Like New", "Good", "Fair", "For Parts")
      .optional(),
    description: Joi.string().allow("").optional(),
    location: Joi.string().optional(),
  });

  return schema.validate(listing);
}

// GET /api/listings (Supports Search, Categories, Distance & Advanced Filters)
router.get("/", async (req, res) => {
  const {
    q,
    categoryId,
    condition,
    minPrice,
    maxPrice,
    sort,
    latitude,
    longitude,
    radius,
  } = req.query;

  const filter = { status: "active" };

  // Search by keyword in title or description
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  // Filter by category
  if (categoryId) {
    filter.categoryId = Number(categoryId);
  }

  // Filter by condition
  if (condition) {
    filter.condition = condition;
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Sort
  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  else if (sort === "price_desc") sortOption = { price: -1 };
  else if (sort === "oldest") sortOption = { createdAt: 1 };

  const listings = await Listing.find(filter)
    .populate("userId", "name email avatar")
    .sort(sortOption);

  const userLat = latitude ? Number(latitude) : null;
  const userLon = longitude ? Number(longitude) : null;

  let results = listings.map((item) => {
    const doc = item.toJSON();
    if (
      userLat !== null &&
      userLon !== null &&
      doc.location &&
      typeof doc.location.latitude === "number" &&
      typeof doc.location.longitude === "number"
    ) {
      const dist = getDistanceFromLatLonInKm(
        userLat,
        userLon,
        doc.location.latitude,
        doc.location.longitude
      );
      doc.distance = Math.round(dist * 10) / 10; // e.g. 2.4 km
    }
    return doc;
  });

  // Filter by radius in kilometers if requested
  if (radius && !isNaN(Number(radius))) {
    const maxDist = Number(radius);
    results = results.filter(
      (item) => item.distance !== undefined && item.distance <= maxDist
    );
  }

  // Sort by distance (closest first)
  if (sort === "distance") {
    results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }

  res.send(results);
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate(
    "userId",
    "name email avatar"
  );
  if (!listing) return res.status(404).send({ error: "Listing not found." });
  res.send(listing);
});

// POST /api/listings
router.post(
  "/",
  [auth, upload.array("images", 10), imageResize],
  async (req, res) => {
    const { error } = validateListing(req.body);
    if (error) return res.status(400).send({ error: error.details[0].message });

    if (!req.images || req.images.length === 0)
      return res.status(400).send({ error: "Please upload at least one image." });

    let location;
    if (req.body.location) {
      try {
        location = JSON.parse(req.body.location);
      } catch (e) {
        console.log("Could not parse location JSON", e);
      }
    }

    const listing = new Listing({
      title: req.body.title,
      price: req.body.price,
      categoryId: req.body.categoryId,
      condition: req.body.condition || "Good",
      description: req.body.description,
      images: req.images,
      location,
      userId: req.user.userId,
    });

    await listing.save();
    res.status(201).send(listing);
  }
);

// PUT /api/listings/:id (Update listing details and photos)
router.put(
  "/:id",
  [auth, upload.array("images", 10), imageResize],
  async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).send({ error: "Listing not found." });

    if (listing.userId.toString() !== req.user.userId.toString()) {
      return res
        .status(403)
        .send({ error: "Unauthorized to edit this listing." });
    }

    const { title, price, description, categoryId, condition, existingImages } =
      req.body;
    if (title) listing.title = title;
    if (price) listing.price = Number(price);
    if (description !== undefined) listing.description = description;
    if (categoryId) listing.categoryId = Number(categoryId);
    if (condition) listing.condition = condition;

    let parsedExistingImages = [];
    if (existingImages) {
      try {
        parsedExistingImages =
          typeof existingImages === "string"
            ? JSON.parse(existingImages)
            : existingImages;
      } catch (e) {
        console.log("Could not parse existingImages", e);
      }
    }

    const newUploadedImages = req.images || [];

    // If photos were modified (existing images kept or new images uploaded)
    if (existingImages !== undefined || newUploadedImages.length > 0) {
      const finalImages = [...parsedExistingImages, ...newUploadedImages];
      if (finalImages.length > 0) {
        // Clean up removed image files from disk
        const keptUrls = new Set(parsedExistingImages.map((img) => img.url));
        const uploadsFolder = path.join(__dirname, "../../uploads");
        listing.images.forEach((img) => {
          if (!keptUrls.has(img.url)) {
            try {
              const fullFilename = path.basename(img.url);
              const thumbFilename = path.basename(img.thumbnailUrl);
              const fullPath = path.join(uploadsFolder, fullFilename);
              const thumbPath = path.join(uploadsFolder, thumbFilename);
              if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
              if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
            } catch (err) {
              console.error("Error removing deleted image:", err);
            }
          }
        });

        listing.images = finalImages;
      }
    }

    await listing.save();
    res.send(listing);
  }
);

// PATCH /api/listings/:id/status (Toggle active / sold)
router.patch("/:id/status", auth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).send({ error: "Listing not found." });

  if (listing.userId.toString() !== req.user.userId.toString()) {
    return res.status(403).send({ error: "Unauthorized to update status." });
  }

  const { status } = req.body;
  if (!["active", "sold"].includes(status)) {
    return res.status(400).send({ error: "Invalid status value." });
  }

  listing.status = status;
  await listing.save();
  res.send(listing);
});

// DELETE /api/listings/:id
router.delete("/:id", auth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).send({ error: "Listing not found." });

  if (listing.userId.toString() !== req.user.userId.toString()) {
    return res.status(403).send({ error: "Unauthorized to delete this listing." });
  }

  // Clean up uploaded image files from disk
  if (listing.images && listing.images.length > 0) {
    const uploadsFolder = path.join(__dirname, "../../uploads");
    listing.images.forEach((img) => {
      try {
        const fullFilename = path.basename(img.url);
        const thumbFilename = path.basename(img.thumbnailUrl);
        const fullPath = path.join(uploadsFolder, fullFilename);
        const thumbPath = path.join(uploadsFolder, thumbFilename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      } catch (err) {
        console.error("Error deleting image file:", err);
      }
    });
  }

  await Listing.findByIdAndDelete(req.params.id);
  res.send({ message: "Listing deleted successfully." });
});

module.exports = router;
