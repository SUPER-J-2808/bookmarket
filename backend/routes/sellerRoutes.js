const express = require("express");
const auth = require("../middleware/auth");
const { idCardUpload } = require("../utils/upload");
const { requestVerification } = require("../controllers/sellerController");

const router = express.Router();

router.post("/request-verification", auth, idCardUpload.single("idCardImage"), requestVerification);

module.exports = router;
