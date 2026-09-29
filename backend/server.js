const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const path = require("path");
const { validateProductionConfig } = require("./config/runtimeConfig");
const { verifyEmailService } = require("./services/emailService");
const { checkStorage } = require("./services/storageService");
const { checkAIService } = require("./services/aiService");
const User = require("./models/user");

dotenv.config();

const productionConfigErrors = validateProductionConfig();
if (productionConfigErrors.length) {
    throw new Error(`Production configuration is incomplete:\n- ${productionConfigErrors.join("\n- ")}`);
}

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

app.use(cors((req, callback) => {
    const origin = req.get("Origin");
    const requestOrigin = `${req.protocol}://${req.get("host")}`;

    if (!origin || origin === requestOrigin || allowedOrigins.includes(origin)) {
        return callback(null, {
            origin: Boolean(origin),
            credentials: true
        });
    }

    console.log("❌ CORS blocked:", origin);
    return callback(new Error("Not allowed by CORS"));
}));

/* =================================
   BODY PARSER
================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
const chatbotRoutes = require("./routes/chatbotRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);

/* =================================
   ROOT ROUTE
================================= */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Campus Resolve Backend is running 🚀"
    });
});

/* =================================
   HEALTH CHECK
================================= */

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is running"
    });
});

app.get("/api/health/ready", async (req, res) => {
    const checks = {
        database: false,
        email: false,
        storage: false,
        ai: false
    };
    const errors = [];

    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            checks.database = true;
        }
    } catch (error) {
        errors.push("database");
    }

    try {
        checks.email = await verifyEmailService();
    } catch (error) {
        errors.push("email");
        console.error("Email readiness check failed:", error.message);
    }

    try {
        checks.storage = await checkStorage();
    } catch (error) {
        errors.push("storage");
        console.error("Storage readiness check failed:", error.message);
    }

    try {
        checks.ai = await checkAIService();
    } catch (error) {
        errors.push("ai");
        console.error("AI readiness check failed:", error.message);
    }

    const ready = Object.values(checks).every(Boolean);
    return res.status(ready ? 200 : 503).json({
        success: ready,
        status: ready ? "ready" : "not_ready",
        checks,
        ...(errors.length ? { failedChecks: errors } : {})
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
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "Each attachment must be 5 MB or smaller." });
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: "Up to three attachments are allowed." });
    }
    if (err.code === "UNSUPPORTED_FILE_TYPE") {
        return res.status(415).json({ success: false, message: err.message });
    }
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ success: false, message: "This origin is not allowed to access the API." });
    }
    console.error("❌ Server Error:", err.message);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    const adminCount = await User.countDocuments({ role: "admin" });
    if (!adminCount) {
        throw new Error("No administrator account exists. Create one with ADMIN_EMAIL and ADMIN_PASSWORD before deployment.");
    }
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log("====================================");
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`❤️  Health: /api/health (liveness), /api/health/ready (readiness)`);
            console.log("====================================");
            resolve(server);
        });
        server.once("error", reject);
    });
};

if (require.main === module) {
    startServer().catch(error => {
        console.error("❌ Server startup failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { app, startServer };
