const multer = require("multer");
const { allowedTypes } = require("../services/storageService");

module.exports = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 3 },
    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error("Attachments must be JPEG, PNG, WebP, or PDF files.");
            error.code = "UNSUPPORTED_FILE_TYPE";
            return callback(error);
        }
        return callback(null, true);
    }
});
