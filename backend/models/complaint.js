const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        // ========================================
        // STUDENT
        // ========================================

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ticketId: { type: String, unique: true, sparse: true, index: true },

        // ========================================
        // COMPLAINT DETAILS
        // ========================================

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            enum: [
                "Academics",
                "Faculty",
                "Infrastructure",
                "Laboratory",
                "Library",
                "Hostel",
                "Canteen",
                "Transport",
                "Fees",
                "Examination",
                "IT/Technical",
                "Other"
            ],
            default: "Other"
        },

        priority: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High",
                "Critical"
            ],
            default: "Medium"
        },

        department: {
            type: String,
            default: "Administration"
        },

        // ========================================
        // COMPLAINT STATUS
        // ========================================

        status: {
            type: String,
            enum: [
                "Pending Approval",
                "Under Review",
                "Assigned",
                "In Progress",
                "Resolved",
                "Rejected"
            ],
            default: "Pending Approval"
        },

        // ========================================
        // ADMIN APPROVAL
        // ========================================

        approvalStatus: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected"
            ],
            default: "pending"
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        approvedAt: {
            type: Date,
            default: null
        },

        // ========================================
        // ADMIN REJECTION
        // ========================================

        rejectionReason: {
            type: String,
            default: ""
        },

        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        rejectedAt: {
            type: Date,
            default: null
        },

        // ========================================
        // ATTACHMENTS
        // ========================================

        images: [
            {
                type: String
            }
        ],

        // ========================================
        // AI ANALYSIS
        // ========================================

        aiAnalysis: {
            category: String,
            priority: String,
            summary: String,
            department: String,
            sentiment: String,
            keywords: [String],
            similarComplaint: Boolean,
            confidence: Number
        },

        // ========================================
        // ADMIN RESPONSE
        // ========================================

        adminResponse: {
            type: String,
            default: ""
        },

        comments: [{
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            text: {
                type: String,
                required: true,
                trim: true,
                maxlength: 3000
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],

        // ========================================
        // ASSIGNED ADMIN
        // ========================================

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ========================================
        // RESOLUTION
        // ========================================

        resolvedAt: {
            type: Date,
            default: null
        },

        statusHistory: [{
            status: { type: String, required: true },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
            changedAt: { type: Date, default: Date.now },
            note: { type: String, default: "" }
        }]
    },
    {
        timestamps: true
    }
);

// A readable ID is assigned at creation. The unique index remains the final
// protection against duplicate IDs under concurrent submissions.
complaintSchema.pre("validate", async function () {
    if (this.ticketId) return;
    const year = new Date().getFullYear();
    const count = await mongoose.model("Complaint").countDocuments({
        ticketId: new RegExp(`^AIMT-${year}-`)
    });
    this.ticketId = `AIMT-${year}-${String(count + 1).padStart(4, "0")}`;
});

module.exports = mongoose.model("Complaint", complaintSchema);
