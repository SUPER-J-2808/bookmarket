const User = require("../models/User");
const Book = require("../models/Book");
const SellerVerification = require("../models/SellerVerification");

const getDashboard = async (_req, res) => {
  const [users, books, requests] = await Promise.all([
    User.find().select("-password").sort({ createdAt: -1 }),
    Book.find().populate("seller", "name email").sort({ createdAt: -1 }),
    SellerVerification.find().populate("user", "name email role sellerVerified").sort({ createdAt: -1 })
  ]);
  res.json({ users, books, requests });
};

const decideSellerRequest = async (req, res) => {
  const { status, note } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }

  const request = await SellerVerification.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });

  request.status = status;
  request.note = note || "";
  await request.save();

  if (status === "approved") {
    await User.findByIdAndUpdate(request.user, { role: "seller", sellerVerified: true });
  }
  // Reject only updates the request record; users stay seller-verified

  res.json({ message: `Request ${status}`, request });
};

module.exports = { getDashboard, decideSellerRequest };
