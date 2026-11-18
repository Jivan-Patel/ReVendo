const express = require("express");
const Joi = require("joi");
const auth = require("../middleware/auth");
const Offer = require("../models/Offer");
const Listing = require("../models/Listing");
const ExpoPushToken = require("../models/ExpoPushToken");
const { sendPushNotification } = require("../services/pushNotifications");

const router = express.Router();

function validateOffer(req) {
  const schema = Joi.object({
    listingId: Joi.string().required(),
    offeredPrice: Joi.number().min(1).required(),
    message: Joi.string().allow("").optional(),
  });
  return schema.validate(req);
}

// POST /api/offers (Buyer makes an offer)
router.post("/", auth, async (req, res) => {
  const { error } = validateOffer(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const listing = await Listing.findById(req.body.listingId);
  if (!listing) return res.status(404).send({ error: "Listing not found." });

  if (listing.status === "sold")
    return res
      .status(400)
      .send({ error: "Cannot make an offer on a sold item." });

  if (listing.userId.toString() === req.user.userId)
    return res
      .status(400)
      .send({ error: "You cannot make an offer on your own listing." });

  const offer = new Offer({
    listingId: listing._id,
    buyerId: req.user.userId,
    sellerId: listing.userId,
    originalPrice: listing.price,
    offeredPrice: Number(req.body.offeredPrice),
    message: req.body.message || "",
  });

  await offer.save();
  await offer.populate("buyerId", "name email");

  // Send Push Notification to Seller
  const sellerToken = await ExpoPushToken.findOne({ userId: listing.userId });
  if (sellerToken && sellerToken.token) {
    sendPushNotification(
      sellerToken.token,
      `New Offer: $${offer.offeredPrice} on "${listing.title}" from ${req.user.name}!`
    );
  }

  res.status(201).send(offer);
});

// GET /api/offers/received (Offers received by current user as seller)
router.get("/received", auth, async (req, res) => {
  const offers = await Offer.find({ sellerId: req.user.userId })
    .populate("buyerId", "name email")
    .populate("listingId", "title price images status")
    .sort({ createdAt: -1 });

  res.send(offers);
});

// GET /api/offers/sent (Offers sent by current user as buyer)
router.get("/sent", auth, async (req, res) => {
  const offers = await Offer.find({ buyerId: req.user.userId })
    .populate("sellerId", "name email")
    .populate("listingId", "title price images status")
    .sort({ createdAt: -1 });

  res.send(offers);
});

// PATCH /api/offers/:id/respond (Seller responds: accept, decline, or counter)
router.patch("/:id/respond", auth, async (req, res) => {
  const { action, counterPrice } = req.body; // action: 'accept' | 'decline' | 'counter'

  if (!["accept", "decline", "counter"].includes(action))
    return res
      .status(400)
      .send({ error: "Action must be 'accept', 'decline', or 'counter'." });

  const offer = await Offer.findById(req.params.id)
    .populate("listingId", "title")
    .populate("buyerId", "name");

  if (!offer) return res.status(404).send({ error: "Offer not found." });

  if (offer.sellerId.toString() !== req.user.userId)
    return res.status(403).send({ error: "Unauthorized." });

  if (action === "accept") {
    offer.status = "accepted";
  } else if (action === "decline") {
    offer.status = "declined";
  } else if (action === "counter") {
    if (!counterPrice || Number(counterPrice) <= 0)
      return res
        .status(400)
        .send({ error: "A valid counter price is required." });
    offer.status = "countered";
    offer.counterPrice = Number(counterPrice);
  }

  await offer.save();

  // Send Push Notification to Buyer
  const buyerToken = await ExpoPushToken.findOne({ userId: offer.buyerId._id });
  if (buyerToken && buyerToken.token) {
    let notifyMsg = "";
    if (action === "accept") {
      notifyMsg = `Congratulations! Your offer of $${offer.offeredPrice} for "${offer.listingId?.title}" was ACCEPTED!`;
    } else if (action === "decline") {
      notifyMsg = `Your offer for "${offer.listingId?.title}" was declined.`;
    } else if (action === "counter") {
      notifyMsg = `Counter-Offer: Seller countered with $${offer.counterPrice} for "${offer.listingId?.title}".`;
    }
    sendPushNotification(buyerToken.token, notifyMsg);
  }

  res.send(offer);
});

// PATCH /api/offers/:id/buyer-respond (Buyer responds to counter-offer)
router.patch("/:id/buyer-respond", auth, async (req, res) => {
  const { action } = req.body; // 'accept' | 'decline'

  if (!["accept", "decline"].includes(action))
    return res.status(400).send({ error: "Action must be 'accept' or 'decline'." });

  const offer = await Offer.findById(req.params.id).populate(
    "listingId",
    "title"
  );
  if (!offer) return res.status(404).send({ error: "Offer not found." });

  if (offer.buyerId.toString() !== req.user.userId)
    return res.status(403).send({ error: "Unauthorized." });

  if (offer.status !== "countered")
    return res
      .status(400)
      .send({ error: "Can only respond to a countered offer." });

  offer.status = action === "accept" ? "accepted" : "declined";
  await offer.save();

  // Send Push Notification to Seller
  const sellerToken = await ExpoPushToken.findOne({ userId: offer.sellerId });
  if (sellerToken && sellerToken.token) {
    const notifyMsg =
      action === "accept"
        ? `Buyer ACCEPTED your counter-offer of $${offer.counterPrice} for "${offer.listingId?.title}"!`
        : `Buyer declined your counter-offer for "${offer.listingId?.title}".`;
    sendPushNotification(sellerToken.token, notifyMsg);
  }

  res.send(offer);
});

module.exports = router;
