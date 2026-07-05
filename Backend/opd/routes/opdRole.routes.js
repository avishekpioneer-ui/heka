import express from "express";
import {
    createRole, getRoles, updateRole, deleteRole,
    createStaff, getStaff, deleteStaff, getDoctors
} from "../controllers/opdRole.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

// Roles
router.post("/roles", requirePermission("manage_roles"), createRole);
router.get("/roles", requirePermission(["manage_roles", "access_opd"]), getRoles);
router.put("/roles/:id", requirePermission("manage_roles"), updateRole);
router.delete("/roles/:id", requirePermission("manage_roles"), deleteRole);

// Staff
router.post("/staff", requirePermission("manage_roles"), createStaff);
router.get("/staff", requirePermission("manage_roles"), getStaff);
router.delete("/staff/:id", requirePermission("manage_roles"), deleteStaff);
router.get("/doctors", requirePermission(["manage_appointments", "manage_consultations", "manage_roles", "access_opd"]), getDoctors);

export default router;
