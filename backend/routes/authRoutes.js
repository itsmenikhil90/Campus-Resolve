const express = require("express");

const {
    register,
    login,
    forgotPassword,
    resetPassword,
    createAdmin
} = require("../controllers/authController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// STUDENT REGISTER
// =====================================================

router.post(
    "/register",
    register
);


// =====================================================
// LOGIN
// =====================================================

router.post(
    "/login",
    login
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
    "/forgot-password",
    forgotPassword
);


// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
    "/reset-password/:token",
    resetPassword
);


// =====================================================
// CREATE ADMIN
// =====================================================

router.post(
    "/create-admin",
    protect,
    authorize("admin"),
    createAdmin
);


// =====================================================
// ADMIN TEST ROUTE
// =====================================================

router.get(
    "/admin-test",
    protect,
    authorize("admin"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Admin access granted",
            user: req.user
        });

    }
);


module.exports = router;
