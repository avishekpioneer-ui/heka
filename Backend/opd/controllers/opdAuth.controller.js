import User from "../../models/User.js";
import OpdUser from "../models/OpdUser.js";
import bcrypt from "bcryptjs";

export const loginOpdUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Try checking the main admin database
        const adminUser = await User.findOne({ email: normalizedEmail });
        if (adminUser && adminUser.category === 'admin') {
            const isPasswordValid = await bcrypt.compare(password, adminUser.password);
            if (isPasswordValid) {
                return res.status(200).json({
                    message: "Admin login successful",
                    user: {
                        id: adminUser._id,
                        name: adminUser.name,
                        email: adminUser.email,
                        category: adminUser.category,
                        roleName: "Admin",
                        permissions: ["*"]
                    }
                });
            }
        }

        // 2. Try checking the OPD staff database
        const staffUser = await OpdUser.findOne({ email: normalizedEmail }).populate("role");
        if (!staffUser) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, staffUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            message: "Staff login successful",
            user: {
                id: staffUser._id,
                name: staffUser.name,
                email: staffUser.email,
                category: staffUser.category,
                roleName: staffUser.role?.name || "Staff",
                permissions: staffUser.role?.permissions || []
            }
        });
    } catch (error) {
        console.error("OPD Staff Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

export const getOpdProfile = async (req, res) => {
    try {
        // req.user is set by verifyOpdUser middleware
        res.status(200).json({ user: req.user });
    } catch (error) {
        console.error("Get OPD Profile Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
