import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "santampatra12345@gmail.com" });

        if (existingAdmin) {
            console.log("⚠️  User with this email already exists");
            console.log("Email: santampatra12345@gmail.com");
            console.log("If you want to update, please delete the user from database first.");
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123456", salt);

        const admin = await User.create({
            name: "Santam Patra",
            email: "santampatra12345@gmail.com",
            password: hashedPassword,
            category: "admin"
        });

        console.log("✅ Admin user created successfully!");
        console.log("==========================================");
        console.log("📧 Email: santampatra12345@gmail.com");
        console.log("🔑 Password: 123456");
        console.log("👤 Category: admin");
        console.log("==========================================");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();
