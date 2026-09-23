const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/user");
const connectDB = require("./config/db");

dotenv.config();

const createAdmin = async () => {
    try {

        await connectDB();

        const existingAdmin = await User.findOne({
            email: "admin@ambalika.ac.in"
        });

        if (existingAdmin) {
            console.log("⚠️ Admin already exists.");
            console.log("Email: admin@ambalika.ac.in");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@12345",
            10
        );

        const admin = await User.create({
            name: "Admin User",

            email: "admin@ambalika.ac.in",

            password: hashedPassword,

            studentId: "ADMIN001",

            department: "Administration",

            year: "Staff",

            role: "admin"
        });

        console.log("====================================");
        console.log("✅ ADMIN CREATED SUCCESSFULLY");
        console.log("====================================");
        console.log("Email    : admin@ambalika.ac.in");
        console.log("Password : Admin@12345");
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
