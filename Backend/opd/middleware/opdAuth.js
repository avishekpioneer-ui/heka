import User from "../../models/User.js";
import OpdUser from "../models/OpdUser.js";
import { LEGACY_PERMISSION_MAP } from "../constants/opdPermissions.js";

// Helper function to check if a user has a specific permission
export const hasPermission = (userPermissions = [], requiredPermission) => {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;
    if (userPermissions.includes("*")) return true; // Wildcard root access

    // Expand userPermissions with legacy mappings
    const effectivePermissions = new Set();
    for (const p of userPermissions) {
        effectivePermissions.add(p);
        if (LEGACY_PERMISSION_MAP[p]) {
            LEGACY_PERMISSION_MAP[p].forEach((mapped) => effectivePermissions.add(mapped));
        }
    }

    if (effectivePermissions.has(requiredPermission)) return true;

    // Check module wildcard: e.g. "patients:*" matches "patients:read"
    if (requiredPermission.includes(":")) {
        const [resource] = requiredPermission.split(":");
        if (effectivePermissions.has(`${resource}:*`)) return true;
    }

    // Check if requiredPermission is a legacy key and user has any or all mapped permissions
    if (LEGACY_PERMISSION_MAP[requiredPermission]) {
        return LEGACY_PERMISSION_MAP[requiredPermission].some((p) => effectivePermissions.has(p));
    }

    return false;
};

// Shared identity resolution used by both the HTTP middleware below and the
// Socket.IO handshake auth, so the two entry points never drift apart.
export const resolveOpdIdentity = async (userId) => {
    if (!userId) return null;

    // 1. First, check if this is the main Admin from the shared User collection
    // Since we are not allowed to change main User schema/logic, we check it directly
    if (userId.match(/^[0-9a-fA-F]{24}$/)) { // Valid ObjectId format
        const adminUser = await User.findById(userId);
        if (adminUser && adminUser.category === 'admin') {
            return {
                id: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                category: adminUser.category,
                roleName: "Admin",
                permissions: ["*"] // Wildcard permission for admin
            };
        }
    }

    // 2. Otherwise, check the OpdUser collection for OPD Staff
    const staffUser = await OpdUser.findById(userId).populate("role");
    if (!staffUser) return null;

    const isDoctor = !!staffUser.isDoctor || (staffUser.role?.name ? staffUser.role.name.toLowerCase().includes("doctor") : false);

    return {
        id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        category: staffUser.category,
        roleId: staffUser.role?._id,
        roleName: staffUser.role?.name || "Staff",
        isDoctor,
        permissions: staffUser.role?.permissions || []
    };
};

export const verifyOpdUser = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User ID is required in headers (x-user-id)" });
        }

        const user = await resolveOpdIdentity(userId);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized. Invalid User or Staff ID." });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("OPD Auth Middleware Error:", error);
        res.status(500).json({ message: "Authentication error" });
    }
};

export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "User context not found. Auth required." });
        }

        const requiredList = Array.isArray(permission) ? permission : [permission];
        const allowed = requiredList.some((p) => hasPermission(req.user.permissions, p));

        if (!allowed) {
            const requiredStr = requiredList.join(" or ");
            return res.status(403).json({ 
                message: `Access denied. You do not have the required permission: '${requiredStr}'` 
            });
        }

        next();
    };
};


