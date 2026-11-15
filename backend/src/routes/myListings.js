const express = require("express");
const auth = require("../middleware/auth");
const Listing = require("../models/Listing");

const router = express.Router();

// GET /api/my/listings
router.get("/listings", auth, async (req, res) => {
  const listings = await Listing.find({ userId: req.user.userId }).sort({
    createdAt: -1,
  });
  res.send(listings);
});

module.exports = router;
