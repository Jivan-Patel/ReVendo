const express = require("express");
const Joi = require("joi");
const auth = require("../middleware/auth");
const Review = require("../models/Review");
const User = require("../models/User");
const Listing = require("../models/Listing");

const router = express.Router();

function validateReview(req) {
  const schema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(2).max(1000).required(),
  });
  return schema.validate(req);
}

// GET /api/reviews/seller/:sellerId (Get reviews and average rating)
router.get("/seller/:sellerId", async (req, res) => {
  const { sellerId } = req.params;

  const reviews = await Review.find({ sellerId })
    .populate("reviewerId", "name email")
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
        ).toFixed(1)
      : 0;

  res.send({
    reviews,
    averageRating: Number(averageRating),
    totalReviews,
  });
});

// GET /api/reviews/seller/:sellerId/profile (Full public seller profile)
router.get("/seller/:sellerId/profile", async (req, res) => {
  const { sellerId } = req.params;

  const seller = await User.findById(sellerId).select(
    "name email avatar bio phone createdAt"
  );
  if (!seller) return res.status(404).send({ error: "Seller not found." });

  const [reviews, listings] = await Promise.all([
    Review.find({ sellerId })
      .populate("reviewerId", "name email avatar")
      .sort({ createdAt: -1 }),
    Listing.find({ userId: sellerId }).sort({ createdAt: -1 }),
  ]);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? Number(
          (
            reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
          ).toFixed(1)
        )
      : 0;

  res.send({
    seller,
    averageRating,
    totalReviews,
    reviews,
    listings,
    activeCount: listings.filter((l) => l.status === "active").length,
    soldCount: listings.filter((l) => l.status === "sold").length,
  });
});

// POST /api/reviews/seller/:sellerId (Leave a review for seller)
router.post("/seller/:sellerId", auth, async (req, res) => {
  const { sellerId } = req.params;

  if (req.user.userId === sellerId)
    return res
      .status(400)
      .send({ error: "You cannot review your own profile." });

  const { error } = validateReview(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const seller = await User.findById(sellerId);
  if (!seller) return res.status(404).send({ error: "Seller not found." });

  const review = new Review({
    sellerId,
    reviewerId: req.user.userId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  await review.save();
  await review.populate("reviewerId", "name email");

  res.status(201).send(review);
});

module.exports = router;
