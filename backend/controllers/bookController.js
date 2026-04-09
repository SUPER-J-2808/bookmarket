const Book = require("../models/Book");
const User = require("../models/User");
const Rating = require("../models/Rating");

const createBook = async (req, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Log in to add a book" });
  }

  const { title, condition, branch, description, sellerPhone } = req.body;
  const price = Number(req.body.price);
  const semester = Number(req.body.semester);

  if (
    !title?.trim() ||
    !Number.isFinite(price) ||
    price < 1 ||
    !condition ||
    Number.isNaN(semester) ||
    semester < 1 ||
    semester > 12 ||
    !branch?.trim()
  ) {
    return res.status(400).json({ message: "Please fill in title, price, condition, branch, and semester (1–12)." });
  }

  const book = await Book.create({
    title: title.trim(),
    image: req.file ? `/uploads/books/${req.file.filename}` : "",
    price,
    condition,
    branch: branch.trim(),
    semester,
    description: (description && String(description).trim()) || "",
    sellerPhone: (sellerPhone && String(sellerPhone).trim()) || req.user.phoneNumber || "",
    seller: req.user._id
  });

  res.status(201).json({ message: "Book listed", book });
};

const getBooks = async (req, res) => {
  const { q, branch, semester, minPrice, maxPrice } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: "i" };
  if (branch) filter.branch = branch;
  if (semester) filter.semester = Number(semester);
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const books = await Book.find(filter)
    .populate("seller", "name email role")
    .sort({ createdAt: -1 });
  res.json(books);
};

const updateBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (String(book.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can edit only your listings" });
  }

  const updates = { ...req.body };
  if (req.file) updates.image = `/uploads/books/${req.file.filename}`;
  const updated = await Book.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json({ message: "Listing updated", book: updated });
};

const deleteBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (String(book.seller) !== String(req.user._id) && req.user.role !== "admin") {
    return res.status(403).json({ message: "You cannot delete this listing" });
  }
  await book.deleteOne();
  res.json({ message: "Listing deleted" });
};

const getSellerProfile = async (req, res) => {
  const seller = await User.findById(req.params.sellerId).select("name email sellerVerified");
  if (!seller) return res.status(404).json({ message: "Seller not found" });

  const ratingStats = await Rating.aggregate([
    { $match: { seller: seller._id } },
    { $group: { _id: "$seller", avgRating: { $avg: "$stars" }, totalRatings: { $sum: 1 } } }
  ]);
  res.json({ seller, rating: ratingStats[0] || { avgRating: 0, totalRatings: 0 } });
};

module.exports = { createBook, getBooks, updateBook, deleteBook, getSellerProfile };
