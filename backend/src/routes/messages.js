const express = require("express");
const Joi = require("joi");
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Listing = require("../models/Listing");
const ExpoPushToken = require("../models/ExpoPushToken");
const { sendPushNotification } = require("../services/pushNotifications");

const router = express.Router();

function validate(message) {
  const schema = Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    listingId: Joi.string().required(),
    toUserId: Joi.string().optional(),
  });

  return schema.validate(message);
}

// GET /api/messages/conversations (All distinct conversation threads for user)
router.get("/conversations", auth, async (req, res) => {
  const userId = req.user.userId;

  // Find all messages where user is either sender or recipient
  const messages = await Message.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .populate("fromUserId", "name email avatar")
    .populate("toUserId", "name email avatar")
    .populate("listingId", "title price images status")
    .sort({ createdAt: -1 });

  const threadsMap = new Map();

  for (const msg of messages) {
    if (!msg.listingId) continue;

    const isFromMe = msg.fromUserId?._id?.toString() === userId.toString();
    const otherUser = isFromMe ? msg.toUserId : msg.fromUserId;
    if (!otherUser) continue;

    const key = `${msg.listingId._id}_${otherUser._id}`;

    if (!threadsMap.has(key)) {
      threadsMap.set(key, {
        id: key,
        listing: msg.listingId,
        otherUser,
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        unread: !isFromMe && !msg.read,
      });
    }
  }

  res.send(Array.from(threadsMap.values()));
});

// GET /api/messages/thread/:listingId/:otherUserId (Get full message thread)
router.get("/thread/:listingId/:otherUserId", auth, async (req, res) => {
  const currentUserId = req.user.userId;
  const { listingId, otherUserId } = req.params;

  const messages = await Message.find({
    listingId,
    $or: [
      { fromUserId: currentUserId, toUserId: otherUserId },
      { fromUserId: otherUserId, toUserId: currentUserId },
    ],
  })
    .populate("fromUserId", "name email avatar")
    .sort({ createdAt: 1 });

  // Mark all incoming messages as read
  await Message.updateMany(
    { listingId, fromUserId: otherUserId, toUserId: currentUserId, read: false },
    { $set: { read: true } }
  );

  res.send(messages);
});

// GET /api/messages (Legacy support: messages received by current user)
router.get("/", auth, async (req, res) => {
  const messages = await Message.find({ toUserId: req.user.userId })
    .populate("fromUserId", "name email avatar")
    .populate("listingId", "title images")
    .sort({ createdAt: -1 });

  res.send(messages);
});

// POST /api/messages (Send message to buyer or seller)
router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const listing = await Listing.findById(req.body.listingId);
  if (!listing) return res.status(404).send({ error: "Listing not found." });

  // Target recipient: either provided in body or defaults to listing owner
  const toUserId = req.body.toUserId || listing.userId;

  const message = new Message({
    message: req.body.message,
    listingId: listing._id,
    fromUserId: req.user.userId,
    toUserId,
  });

  await message.save();
  await message.populate("fromUserId", "name email avatar");

  // Trigger push notification to recipient if token exists
  const recipientToken = await ExpoPushToken.findOne({ userId: toUserId });
  if (recipientToken && recipientToken.token) {
    sendPushNotification(
      recipientToken.token,
      `New message from ${req.user.name || "buyer"} on "${listing.title}": ${req.body.message}`
    );
  }

  res.status(201).send(message);
});

module.exports = router;
