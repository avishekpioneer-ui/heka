import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "admin@heka.com" });

        if (existingAdmin) {
            console.log("⚠️  Admin user already exists");
            console.log("Email: admin@heka.com");
            console.log("If you forgot the password, please delete the user from database and run this script again.");
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const admin = await User.create({
            name: "Admin User",
            email: "admin@heka.com",
            password: hashedPassword,
            category: "admin"
        });

        console.log("✅ Admin user created successfully!");
        console.log("==========================================");
        console.log("📧 Email: admin@heka.com");
        console.log("🔑 Password: admin123");
        console.log("==========================================");
        console.log("⚠️  IMPORTANT: Please change the password after first login!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
