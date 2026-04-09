const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    sellerVerified: { type: Boolean, default: true },
    collegeVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
