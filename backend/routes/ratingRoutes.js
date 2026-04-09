const express = require("express");
const auth = require("../middleware/auth");
const { rateSeller } = require("../controllers/ratingController");

const router = express.Router();

router.post("/", auth, rateSeller);

module.exports = router;
