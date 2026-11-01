require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");
const auth = require("./src/routes/auth");
const users = require("./src/routes/users");
const listings = require("./src/routes/listings");
const myListings = require("./src/routes/myListings");
const messages = require("./src/routes/messages");
const expoPushTokens = require("./src/routes/expoPushTokens");
const wishlist = require("./src/routes/wishlist");
const reviews = require("./src/routes/reviews");
const offers = require("./src/routes/offers");
const errorHandler = require("./src/middleware/error");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(morgan("dev"));

// Static Folder for Uploaded Images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/listings", listings);
app.use("/api/my", myListings);
app.use("/api/messages", messages);
app.use("/api/expoPushTokens", expoPushTokens);
app.use("/api/wishlist", wishlist);
app.use("/api/reviews", reviews);
app.use("/api/offers", offers);

// Health Check
app.get("/api/health", (req, res) => {
  res.send({ status: "OK", timestamp: new Date() });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 9000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`===============================================`);
  console.log(`ReVendo Backend running on http://0.0.0.0:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`===============================================`);
});
