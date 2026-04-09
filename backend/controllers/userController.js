const User = require("../models/User");
const Rating = require("../models/Rating");

const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const ratingStats = await Rating.aggregate([
    { $match: { seller: user._id } },
    { $group: { _id: "$seller", avgRating: { $avg: "$stars" }, totalRatings: { $sum: 1 } } }
  ]);
  const stats = ratingStats[0] || { avgRating: 0, totalRatings: 0 };
  res.json({ user, rating: stats });
};

module.exports = { getProfile };
