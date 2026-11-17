const express = require("express");
const Joi = require("joi");
const auth = require("../middleware/auth");
const ExpoPushToken = require("../models/ExpoPushToken");

const router = express.Router();

function validate(req) {
  const schema = Joi.object({
    token: Joi.string().required(),
  });

  return schema.validate(req);
}

// POST /api/expoPushTokens
router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  await ExpoPushToken.findOneAndUpdate(
    { userId: req.user.userId },
    { token: req.body.token },
    { upsert: true, new: true }
  );

  res.status(201).send({ message: "Push token registered successfully." });
});

module.exports = router;
