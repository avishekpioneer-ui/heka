import User from "../models/User.js";

export const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User ID is required in headers" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.category !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admin privileges required." });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ message: "Authentication error" });
    }
};
