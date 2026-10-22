const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const path = require("path");

const connectDB = require("./config/db");
const { validateProductionConfig } = require("./config/runtimeConfig");
const { verifyEmailService } = require("./services/emailService");
const { checkStorage } = require("./services/storageService");
const { checkAIService } = require("./services/aiService");
const User = require("./models/user");

dotenv.config();

/* =================================
   PRODUCTION CONFIGURATION
================================= */

if (process.env.NODE_ENV === "production") {
    const productionConfigErrors = validateProductionConfig();

    if (productionConfigErrors.length > 0) {
        console.error(
            "Production configuration errors:",
            productionConfigErrors
        );

        process.exit(1);
    }
}

/* =================================
   EXPRESS APP
================================= */

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
    .map(origin => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

app.use(
    cors((req, callback) => {
        const origin = req.get("Origin");
        const normalizedOrigin = origin
            ? origin.replace(/\/+$/, "")
            : "";

        if (
            !origin ||
            allowedOrigins.includes(normalizedOrigin)
        ) {
            return callback(null, {
                origin: Boolean(origin),
                credentials: true
            });
        }

        console.error("CORS blocked:", origin);

        return callback(
            new Error("Not allowed by CORS")
        );
    })
);

/* =================================
   BODY PARSERS
================================= */

app.use(express.json({ limit: "10mb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

app.use(
    express.static(
        path.join(__dirname, "..", "frontend")
    )
);

/* =================================
   LOGGER
================================= */

app.use(morgan("dev"));

/* =================================
   RATE LIMITING
================================= */

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,

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
    res.status(200).json({
        success: true,
        message: "AI Campus Resolve backend is running"
    });
});

/* =================================
   LIVENESS CHECK
================================= */

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is running",
        uptime: process.uptime()
    });
});

/* =================================
   READINESS CHECK
================================= */

app.get("/api/health/ready", async (req, res) => {
    const checks = {
        database: false,
        email: false,
        storage: false,
        ai: false,
        admin: false
    };

    const errors = [];

    // Database
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            checks.database = true;
        } else {
            errors.push("database");
        }
    } catch (error) {
        errors.push("database");
        console.error("Database readiness check failed:", error.message);
    }

    // Administrator
    try {
        if (checks.database) {
            const adminCount = await User.countDocuments({
                role: "admin"
            });

            checks.admin = adminCount > 0;

            if (!checks.admin) {
                errors.push("admin");
            }
        }
    } catch (error) {
        errors.push("admin");
        console.error("Admin readiness check failed:", error.message);
    }

    // Email service
    try {
        checks.email = Boolean(await verifyEmailService());

        if (!checks.email) {
            errors.push("email");
        }
    } catch (error) {
        errors.push("email");
        console.error("Email readiness check failed:", error.message);
    }

    // Storage service
    try {
        checks.storage = Boolean(await checkStorage());

        if (!checks.storage) {
            errors.push("storage");
        }
    } catch (error) {
        errors.push("storage");
        console.error("Storage readiness check failed:", error.message);
    }

    // AI service
    try {
        checks.ai = Boolean(await checkAIService());

        if (!checks.ai) {
            errors.push("ai");
        }
    } catch (error) {
        errors.push("ai");
        console.error("AI readiness check failed:", error.message);
    }

    const ready = Object.values(checks).every(Boolean);

    return res.status(ready ? 200 : 503).json({
        success: ready,
        status: ready ? "ready" : "not_ready",
        checks,
        ...(errors.length
            ? { failedChecks: [...new Set(errors)] }
            : {})
    });
});

/* =================================
   404 HANDLER
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
    if (res.headersSent) {
        return next(err);
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: "Each attachment must be 5 MB or smaller."
        });
    }

    if (
        err.code === "LIMIT_FILE_COUNT" ||
        err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
        return res.status(400).json({
            success: false,
            message: "Up to three attachments are allowed."
        });
    }

    if (err.code === "UNSUPPORTED_FILE_TYPE") {
        return res.status(415).json({
            success: false,
            message: err.message
        });
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "This origin is not allowed to access the API."
        });
    }

    console.error("Server error:", err.message);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

/* =================================
   SERVER STARTUP
================================= */

const PORT = process.env.PORT || 5000;

let server;
let shuttingDown = false;

const startServer = async () => {
    /*
     * Start listening immediately so Render can
     * detect the assigned port.
     */

    server = await new Promise((resolve, reject) => {
        const httpServer = app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log("====================================");
                console.log(`Server running on port ${PORT}`);
                console.log("Health: /api/health");
                console.log("Readiness: /api/health/ready");
                console.log("====================================");

                resolve(httpServer);
            }
        );

        httpServer.once("error", reject);
    });

    /*
     * Initialize the database after the port is open.
     */

    try {
        await connectDB();

        console.log("MongoDB connected successfully");

        const adminCount = await User.countDocuments({
            role: "admin"
        });

        if (adminCount === 0) {
            console.error(
                "WARNING: No administrator account exists. " +
                "Create an admin account before using the application."
            );
        } else {
            console.log("Administrator account verified");
        }
    } catch (error) {
        console.error(
            "Application initialization failed:",
            error.message
        );

        /*
         * Do not terminate the process immediately.
         * The health endpoint remains accessible, but
         * readiness checks will report the failure.
         */
    }

    return server;
};

/* =================================
   GRACEFUL SHUTDOWN
================================= */

const shutdown = signal => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(`${signal} received. Shutting down...`);

    const forceExit = setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10000);

    forceExit.unref();

    if (server) {
        server.close(async () => {
            try {
                await mongoose.disconnect();
            } catch (error) {
                console.error(
                    "MongoDB disconnect error:",
                    error.message
                );
            }

            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/* =================================
   HANDLE UNEXPECTED ERRORS
================================= */

process.on("unhandledRejection", reason => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", error => {
    console.error("Uncaught exception:", error);

    shutdown("UNCAUGHT_EXCEPTION");
});

/* =================================
   ENTRY POINT
================================= */

if (require.main === module) {
    startServer().catch(error => {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    });
}

module.exports = {
    app,
    startServer
};