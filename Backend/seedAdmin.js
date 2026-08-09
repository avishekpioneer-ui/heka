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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        // Check if admin already exists
        let admin = await User.findOne({ email: "admin@heka.com" });

        if (admin) {
            admin.password = hashedPassword;
            admin.category = "admin";
            await admin.save();
            console.log("✅ Admin user existing record updated successfully!");
        } else {
            admin = await User.create({
                name: "Admin User",
                email: "admin@heka.com",
                password: hashedPassword,
                category: "admin"
            });
            console.log("✅ Admin user created successfully!");
        }

        console.log("==========================================");
        console.log("📧 Email: admin@heka.com");
        console.log("🔑 Password: admin123");
        console.log("👤 Category: admin");
        console.log("==========================================");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
