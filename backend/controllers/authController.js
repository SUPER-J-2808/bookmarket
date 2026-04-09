const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isCollegeEmail } = require("../utils/validation");

const buildToken = (userId) =>
  jwt.sign({ id: String(userId) }, process.env.JWT_SECRET || "campus-book-secret", {
    expiresIn: "7d"
  });

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  sellerVerified: Boolean(user.sellerVerified)
});

const register = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (!isCollegeEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    phoneNumber: phoneNumber || "",
    collegeVerified: true,
    sellerVerified: true
  });

  return res.status(201).json({
    token: buildToken(user._id),
    user: toPublicUser(user)
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({
    token: buildToken(user._id),
    user: toPublicUser(user)
  });
};

module.exports = { register, login };
