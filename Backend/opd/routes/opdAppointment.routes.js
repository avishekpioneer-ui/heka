import express from "express";
import { createAppointment, getAppointments, updateAppointmentStatus } from "../controllers/opdAppointment.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("manage_appointments"), createAppointment);
router.get("/", requirePermission(["manage_appointments", "manage_consultations"]), getAppointments);
router.put("/:id/status", requirePermission(["manage_appointments", "manage_consultations"]), updateAppointmentStatus);

export default router;
