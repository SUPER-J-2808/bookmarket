const SellerVerification = require("../models/SellerVerification");

const requestVerification = async (req, res) => {
  const existing = await SellerVerification.findOne({
    user: req.user._id,
    status: "pending"
  });
  if (existing) return res.status(400).json({ message: "A pending request already exists" });

  const method = req.file ? "id_card" : "college_email";
  const request = await SellerVerification.create({
    user: req.user._id,
    method,
    idCardImage: req.file ? `/uploads/idcards/${req.file.filename}` : ""
  });
  res.status(201).json({ message: "Verification request submitted", request });
};

module.exports = { requestVerification };
