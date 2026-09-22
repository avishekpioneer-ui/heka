import express from "express";
import { createAppointment, getAppointments, updateAppointmentStatus } from "../controllers/opdAppointment.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("appointments:add"), createAppointment);
router.get("/", requirePermission(["appointments:read", "consultations:read"]), getAppointments);
router.put("/:id/status", requirePermission(["appointments:edit", "consultations:edit"]), updateAppointmentStatus);

export default router;
