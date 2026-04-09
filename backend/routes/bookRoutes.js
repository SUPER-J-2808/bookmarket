const express = require("express");
const auth = require("../middleware/auth");
const syncListingUser = require("../middleware/syncListingUser");
const { bookImageUpload } = require("../utils/upload");
const {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
  getSellerProfile
} = require("../controllers/bookController");

const router = express.Router();

router.get("/", getBooks);
router.get("/seller/:sellerId", getSellerProfile);
router.post("/", auth, syncListingUser, bookImageUpload.single("image"), createBook);
router.put("/:id", auth, syncListingUser, bookImageUpload.single("image"), updateBook);
router.delete("/:id", auth, deleteBook);

module.exports = router;
