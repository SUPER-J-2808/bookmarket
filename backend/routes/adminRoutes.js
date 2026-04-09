const express = require("express");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { getDashboard, decideSellerRequest } = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", auth, authorize("admin"), getDashboard);
router.patch("/verification/:id", auth, authorize("admin"), decideSellerRequest);

module.exports = router;
