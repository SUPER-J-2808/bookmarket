const express = require("express");
const auth = require("../middleware/auth");
const {
  createOrderRequest,
  updateOrderStatus,
  getMyOrders
} = require("../controllers/orderController");

const router = express.Router();

router.post("/", auth, createOrderRequest);
router.get("/my", auth, getMyOrders);
router.patch("/:id/status", auth, updateOrderStatus);

module.exports = router;
