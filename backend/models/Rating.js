const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

ratingSchema.index({ seller: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
