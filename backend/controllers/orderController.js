const OrderRequest = require("../models/OrderRequest");
const Book = require("../models/Book");

const createOrderRequest = async (req, res) => {
  const { bookId, message } = req.body;
  const book = await Book.findById(bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });
  if (String(book.seller) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot request your own book" });
  }

  const order = await OrderRequest.create({
    buyer: req.user._id,
    seller: book.seller,
    book: book._id,
    message: message || ""
  });
  res.status(201).json({ message: "Order request sent", order });
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be accepted or rejected" });
  }
  const order = await OrderRequest.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Request not found" });
  if (String(order.seller) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only seller can manage this request" });
  }
  order.status = status;
  await order.save();
  res.json({ message: "Order status updated", order });
};

const getMyOrders = async (req, res) => {
  const requests = await OrderRequest.find({
    $or: [{ buyer: req.user._id }, { seller: req.user._id }]
  })
    .populate("book", "title price")
    .populate("buyer", "name email")
    .populate("seller", "name email")
    .sort({ createdAt: -1 });
  res.json(requests);
};

module.exports = { createOrderRequest, updateOrderStatus, getMyOrders };
