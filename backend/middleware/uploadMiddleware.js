const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 3 }, fileFilter: (req, file, cb) => cb(null, allowed.has(file.mimetype)) });
