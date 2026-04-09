const mongoose = require("mongoose");

const sellerVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method: { type: String, enum: ["id_card", "college_email"], required: true },
    idCardImage: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerVerification", sellerVerificationSchema);
