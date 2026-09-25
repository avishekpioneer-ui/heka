import express from "express";
import {
    createRole, getRoles, updateRole, deleteRole,
    createStaff, getStaff, updateStaff, deleteStaff, getDoctors,
    getPermissions
} from "../controllers/opdRole.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

// Schema definitions for client UI
router.get("/permissions", requirePermission(["roles:read", "access_opd"]), getPermissions);

// Roles
router.post("/roles", requirePermission("roles:add"), createRole);
router.get("/roles", requirePermission(["roles:read", "access_opd"]), getRoles);
router.put("/roles/:id", requirePermission("roles:edit"), updateRole);
router.delete("/roles/:id", requirePermission("roles:delete"), deleteRole);

// Staff
router.post("/staff", requirePermission("roles:add"), createStaff);
router.get("/staff", requirePermission("roles:read"), getStaff);
router.put("/staff/:id", requirePermission(["roles:edit", "manage_roles"]), updateStaff);
router.delete("/staff/:id", requirePermission("roles:delete"), deleteStaff);
router.get("/doctors", requirePermission(["appointments:read", "appointments:add", "consultations:read", "roles:read", "access_opd"]), getDoctors);

export default router;

