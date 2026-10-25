const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            trim: true
        },

        year: {
            type: String,
            required: true
        },

        role: {
            type: String,
            default: "student",
            validate: {
                validator(value) {
                    const allowed = [
                        "student",
                        "admin",
                        "staff",
                        "class_representative",
                        "class_coordinator",
                        "hod",
                        "dean",
                        "proctor",
                        "director",
                        "assistant_director",
                        "associate_director",
                        "chairman"
                    ];
                    const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");
                    return allowed.includes(normalized);
                },
                message: "Unsupported user role"
            }
        },

        // =============================
        // PASSWORD RESET
        // =============================

        resetPasswordToken: {
            type: String,
            default: null
        },

        resetPasswordExpire: {
            type: Date,
            default: null
        },

        resetPasswordOtp: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
