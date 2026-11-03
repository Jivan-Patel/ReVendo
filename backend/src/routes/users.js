const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const User = require("../models/User");

const router = express.Router();

const outputFolder = path.join(__dirname, "../../uploads");
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(4).max(255).required(),
  });

  return schema.validate(user);
}

// POST /api/users (Register)
router.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  let user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (user) return res.status(400).send({ error: "User already registered." });

  user = new User({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    password: req.body.password,
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  res.status(201).send(user);
});

// GET /api/users/me (Get current authenticated user profile)
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) return res.status(404).send({ error: "User not found." });
  res.send(user);
});

// PUT /api/users/profile (Update account information and profile picture)
router.put("/profile", [auth, upload.single("avatar")], async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).send({ error: "User not found." });

  const { name, bio, phone, password, removeAvatar } = req.body;

  if (name && name.trim()) {
    if (name.trim().length < 2) {
      return res
        .status(400)
        .send({ error: "Name must be at least 2 characters." });
    }
    user.name = name.trim();
  }

  if (typeof bio === "string") {
    user.bio = bio.trim();
  }

  if (typeof phone === "string") {
    user.phone = phone.trim();
  }

  if (password && password.trim().length >= 4) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password.trim(), salt);
  }

  // Handle Avatar image upload or removal
  if (req.file) {
    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = `avatar_${uniqueSuffix}.jpg`;
      const filePath = path.join(outputFolder, filename);

      await sharp(req.file.buffer)
        .resize(400, 400, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      const host = req.get("host");
      const baseUrl = process.env.BASE_URL || `http://${host}`;
      user.avatar = `${baseUrl}/uploads/${filename}`;
    } catch (err) {
      console.error("Avatar upload error:", err);
      return res.status(500).send({ error: "Could not process avatar image." });
    }
  } else if (removeAvatar === "true" || removeAvatar === true) {
    user.avatar = null;
  }

  await user.save();

  const token = user.generateAuthToken();
  res.send({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      phone: user.phone,
    },
    token,
  });
});

module.exports = router;