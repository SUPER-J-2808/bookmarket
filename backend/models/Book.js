const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 1 },
    condition: { type: String, enum: ["New", "Good", "Old"], required: true },
    branch: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    description: { type: String, default: "", trim: true },
    sellerPhone: { type: String, default: "" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
