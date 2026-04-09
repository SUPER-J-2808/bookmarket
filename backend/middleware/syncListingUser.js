const User = require("../models/User");

/**
 * Before creating/editing listings: mark user as verified seller in DB and on req.user.
 * Keeps listing working if older data or code still expected seller + verified.
 */
module.exports = async function syncListingUser(req, res, next) {
  try {
    if (!req.user?._id) return next();

    const isAdmin = req.user.role === "admin";
    const update = { sellerVerified: true };
    if (!isAdmin) update.role = "seller";

    await User.findByIdAndUpdate(req.user._id, { $set: update });
    req.user.sellerVerified = true;
    if (!isAdmin) req.user.role = "seller";

    next();
  } catch (err) {
    next(err);
  }
};
