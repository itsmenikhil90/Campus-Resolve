const express = require("express");
const rateLimit = require("express-rate-limit");
const { chat } = require("../controllers/chatbotController");
const { optionalProtect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: { success: false, message: "Chat limit reached. Please try again later." }
    }),
    optionalProtect,
    chat
);

module.exports = router;
