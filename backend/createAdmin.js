const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/user");
const connectDB = require("./config/db");

dotenv.config();

const createAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;
        if (!email || !password) {
            throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before creating an administrator.");
        }

        await connectDB();

        const existingAdmin = await User.findOne({
            email
        });

        if (existingAdmin) {
            console.log("⚠️ Admin already exists.");
            console.log(`Email: ${email}`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const admin = await User.create({
            name: "Admin User",

            email,

            password: hashedPassword,

            studentId: "ADMIN001",

            department: "Administration",

            year: "Staff",

            role: "admin"
        });

        console.log("====================================");
        console.log("✅ ADMIN CREATED SUCCESSFULLY");
        console.log("====================================");
        console.log(`Email    : ${email}`);
        console.log("Role     : admin");
        console.log("====================================");

        process.exit(0);

    } catch (error) {

        console.error("❌ Admin Creation Error:");
        console.error(error);

        process.exit(1);
    }
};

createAdmin();
