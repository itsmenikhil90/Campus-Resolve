const jwt = require("jsonwebtoken");
const User = require("../models/user");


// =============================
// PROTECT ROUTE
// =============================
const protect = async (req, res, next) => {
    try {
        let token;

        // Get token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. Token missing."
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user
        const user = await User.findById(decoded.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found."
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {
        console.error("Auth Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

const optionalProtect = async (req, res, next) => {
    if (!req.headers.authorization) return next();
    return protect(req, res, next);
};


// =============================
// ROLE AUTHORIZATION
// =============================
const normalizeRole = value => String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

const authorize = (...roles) => {
    return (req, res, next) => {
        const allowedRoles = roles.map(normalizeRole);
        const userRole = normalizeRole(req.user.role);

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        next();
    };
};


module.exports = {
    protect,
    optionalProtect,
    authorize
};
