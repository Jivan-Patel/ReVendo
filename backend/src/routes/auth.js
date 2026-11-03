const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const User = require("../models/User");

const router = express.Router();

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(4).max(255).required(),
  });

  return schema.validate(req);
}

// POST /api/auth (Login)
router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user) return res.status(400).send({ error: "Invalid email or password." });

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send({ error: "Invalid email or password." });

  const token = user.generateAuthToken();
  res.send(token);
});

module.exports = router;
