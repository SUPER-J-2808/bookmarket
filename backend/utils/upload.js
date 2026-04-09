const path = require("path");
const multer = require("multer");

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "uploads", folder)),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e8)}${ext}`);
    }
  });

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only JPG, PNG, WEBP files are allowed"), false);
};

const idCardUpload = multer({ storage: createStorage("idcards"), fileFilter });
const bookImageUpload = multer({ storage: createStorage("books"), fileFilter });

module.exports = { idCardUpload, bookImageUpload };
