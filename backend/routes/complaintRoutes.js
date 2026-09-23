const express = require("express");

const {
    createComplaint,
    getMyComplaints,
    getComplaintById,

    getAllComplaints,
    getComplaintStats,

    approveComplaint,
    rejectComplaint,

    updateComplaintStatus,
    addAdminResponse,
    addComment,
    assignComplaint

} = require("../controllers/complaintController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();
const upload = require("../middleware/uploadMiddleware");


// ======================================================
// STUDENT ROUTES
// ======================================================


// ========================================
// STUDENT - CREATE COMPLAINT
// ========================================

router.post(
    "/",
    protect,
    upload.array("attachments", 3),
    createComplaint
);


// ========================================
// STUDENT - GET OWN COMPLAINTS
// ========================================

router.get(
    "/my",
    protect,
    getMyComplaints
);


// ======================================================
// ADMIN ROUTES
// ======================================================


// ========================================
// ADMIN - GET ALL COMPLAINTS
// ========================================

router.get(
    "/admin/all",
    protect,
    authorize("admin"),
    getAllComplaints
);


// ========================================
// ADMIN - DASHBOARD STATISTICS
// ========================================

router.get(
    "/admin/stats",
    protect,
    authorize("admin"),
    getComplaintStats
);


// ========================================
// ADMIN - APPROVE COMPLAINT
// ========================================

router.patch(
    "/admin/:id/approve",
    protect,
    authorize("admin"),
    approveComplaint
);


// ========================================
// ADMIN - REJECT COMPLAINT
// ========================================

router.patch(
    "/admin/:id/reject",
    protect,
    authorize("admin"),
    rejectComplaint
);


// ========================================
// ADMIN - UPDATE COMPLAINT STATUS
// ========================================

router.patch(
    "/admin/:id/status",
    protect,
    authorize("admin"),
    updateComplaintStatus
);


// ========================================
// ADMIN - ADD RESPONSE
// ========================================

router.patch(
    "/admin/:id/response",
    protect,
    authorize("admin"),
    addAdminResponse
);

router.post(
    "/admin/:id/comments",
    protect,
    authorize("admin"),
    addComment
);


// ========================================
// ADMIN - ASSIGN COMPLAINT
// ========================================

router.patch(
    "/admin/:id/assign",
    protect,
    authorize("admin"),
    assignComplaint
);


// ======================================================
// SINGLE COMPLAINT
// ======================================================

// Keep this AFTER all /admin/* routes.

router.get(
    "/:id",
    protect,
    getComplaintById
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;
