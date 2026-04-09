const Rating = require("../models/Rating");
const User = require("../models/User");

const rateSeller = async (req, res) => {
  const { sellerId, stars, review } = req.body;
  if (!sellerId || !stars) return res.status(400).json({ message: "sellerId and stars are required" });
  if (Number(stars) < 1 || Number(stars) > 5) {
    return res.status(400).json({ message: "Stars must be between 1 and 5" });
  }

  const seller = await User.findById(sellerId);
  if (!seller) return res.status(404).json({ message: "Seller not found" });
  if (String(seller._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot rate yourself" });
  }

  const rating = await Rating.findOneAndUpdate(
    { seller: sellerId, buyer: req.user._id },
    { stars: Number(stars), review: review || "" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ message: "Rating saved", rating });
};

module.exports = { rateSeller };
