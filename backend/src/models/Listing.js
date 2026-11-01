const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    categoryId: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      enum: ["Brand New", "Like New", "Good", "Fair", "For Parts"],
      default: "Good",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "sold"],
      default: "active",
    },
    images: [
      {
        url: { type: String, required: true },
        thumbnailUrl: { type: String, required: true },
      },
    ],
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Listing", listingSchema);
