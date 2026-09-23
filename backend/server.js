const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const path = require("path");

dotenv.config();

if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("replace_with"))) {
    throw new Error("JWT_SECRET must be configured with a strong production secret");
}

// Connect MongoDB
connectDB();

const app = express();

/* =================================
   SECURITY
================================= */

app.use(helmet());

/* =================================
   CORS
================================= */

const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests without an origin
            // Example: Postman
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("❌ CORS blocked:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        credentials: true
    })
);

/* =================================
   BODY PARSER
================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { index: false, dotfiles: "deny" }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

/* =================================
   LOGGER
================================= */

app.use(morgan("dev"));

/* =================================
   RATE LIMIT
================================= */

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", limiter);

/* =================================
   ROUTES
================================= */

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

/* =================================
   ROOT ROUTE
================================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

/* =================================
   HEALTH CHECK
================================= */

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is connected successfully"
    });
});

/* =================================
   404 ROUTE
================================= */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

/* =================================
   ERROR HANDLER
================================= */

app.use((err, req, res, next) => {

    console.error("❌ Server Error:", err.message);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

/* =================================
   SERVER
================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("====================================");
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log("====================================");
});
