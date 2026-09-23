const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/user");


// =====================================================
// GENERATE JWT TOKEN
// =====================================================

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};


// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } })
    : null;


// =====================================================
// REGISTER STUDENT
// =====================================================

const register = async (req, res) => {
    try {

        const {
            name,
            email,
            password,
            studentId,
            department,
            year
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !studentId ||
            !department ||
            !year
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const existingStudent = await User.findOne({ studentId });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: "Student ID already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            studentId,
            department,
            year,
            role: "student"
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: "Student registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                year: user.year,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Register Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
    try {

        const {
            email,
            studentId,
            password
        } = req.body;

        const identifier = (email || studentId || "").trim();

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Email or student ID and password are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { studentId: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                department: user.department,
                year: user.year,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// =====================================================
// FORGOT PASSWORD
// =====================================================

const forgotPassword = async (req, res) => {

    try {

        const email = req.body.email?.toLowerCase().trim();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const user = await User.findOne({ email });

        // Do not reveal whether an account exists.
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account exists with this email, a reset OTP has been sent."
            });
        }

        const resetOtp = String(crypto.randomInt(100000, 1000000));

        const hashedOtp = crypto
            .createHash("sha256")
            .update(resetOtp)
            .digest("hex");

        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from:
                process.env.EMAIL_FROM ||
                process.env.SMTP_FROM ||
                process.env.SMTP_USER,

            to: user.email,

            subject: "AIMT Grievance Portal - Password Reset OTP",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    background: #f8f5ed;
                    border: 1px solid #d6c27a;
                ">

                    <h2 style="color:#142451;">
                        AIMT Grievance Portal
                    </h2>

                    <p>
                        Hello <strong>${user.name}</strong>,
                    </p>

                    <p>
                        We received a request to reset the password
                        for your AIMT Grievance Portal account.
                    </p>

                    <p>
                        Use this one-time password to create a new password:
                    </p>

                    <div style="margin:30px 0;font-size:32px;letter-spacing:8px;font-weight:bold;color:#142451;">
                        ${resetOtp}
                    </div>

                    <p>
                        This link will expire in
                        <strong>15 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <hr>

                    <p style="font-size:12px;color:#777;">
                        AIMT Grievance Cell<br>
                        Ambalika Institute of Management & Technology
                    </p>

                </div>
            `
        };

        if (!transporter) {
            console.error("Password reset requested but email service is not configured.");
            return res.status(503).json({ success: false, message: "Password reset email service is not configured." });
        }
        await transporter.sendMail(mailOptions);

        console.log(`📧 Password reset email sent to ${user.email}`);

        return res.status(200).json({
            success: true,
            message: "If an account exists with this email, a reset OTP has been sent."
        });

    } catch (error) {

        console.error("Forgot Password Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send password reset email"
        });
    }
};


// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {

    try {

        const { token } = req.params;

        const { email, password, confirmPassword } = req.body;

        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: "Email and reset OTP are required"
            });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // Hash token received from email.
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            $or: [
                { resetPasswordOtp: hashedToken },
                { resetPasswordToken: hashedToken }
            ],
            resetPasswordExpire: {
                $gt: Date.now()
            }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset link is invalid or has expired"
            });
        }

        // Hash new password.
        user.password = await bcrypt.hash(password, 12);

        // Invalidate token immediately.
        user.resetPasswordToken = null;
        user.resetPasswordOtp = null;
        user.resetPasswordExpire = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now login."
        });

    } catch (error) {

        console.error("Reset Password Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while resetting password"
        });
    }
};


// =====================================================
// CREATE ADMIN
// =====================================================

const createAdmin = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            studentId,
            department,
            year
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !studentId ||
            !department ||
            !year
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const existingEmail = await User.findOne({ email });

        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const existingStudent = await User.findOne({ studentId });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: "Student ID already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            studentId,
            department,
            year,
            role: "admin"
        });

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                studentId: admin.studentId,
                department: admin.department,
                year: admin.year,
                role: admin.role
            }
        });

    } catch (error) {

        console.error("Create Admin Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating admin"
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    createAdmin
};
