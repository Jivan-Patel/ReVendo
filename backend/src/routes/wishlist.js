const express = require("express");
const auth = require("../middleware/auth");
const Wishlist = require("../models/Wishlist");
const Listing = require("../models/Listing");

const router = express.Router();

// GET /api/wishlist (Get user's full wishlist items)
router.get("/", auth, async (req, res) => {
  const items = await Wishlist.find({ userId: req.user.userId })
    .populate({
      path: "listingId",
      populate: { path: "userId", select: "name email" },
    })
    .sort({ createdAt: -1 });

  // Filter out any where the listing was deleted
  const validListings = items
    .filter((item) => item.listingId != null)
    .map((item) => item.listingId);

  res.send(validListings);
});

// GET /api/wishlist/ids (Get array of favorited listing IDs for instant UI rendering)
router.get("/ids", auth, async (req, res) => {
  const items = await Wishlist.find({ userId: req.user.userId }).select(
    "listingId"
  );
  const ids = items.map((item) => item.listingId.toString());
  res.send(ids);
});

// POST /api/wishlist/toggle/:listingId (Toggle add/remove from wishlist)
router.post("/toggle/:listingId", auth, async (req, res) => {
  const { listingId } = req.params;

  const listing = await Listing.findById(listingId);
  if (!listing) return res.status(404).send({ error: "Listing not found." });

  const existing = await Wishlist.findOne({
    userId: req.user.userId,
    listingId,
  });

  if (existing) {
    await Wishlist.findByIdAndDelete(existing._id);
    return res.send({ isFavorite: false, listingId });
  } else {
    await Wishlist.create({
      userId: req.user.userId,
      listingId,
    });
    return res.status(201).send({ isFavorite: true, listingId });
  }
});

module.exports = router;
