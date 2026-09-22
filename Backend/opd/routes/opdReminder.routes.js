import express from "express";
import { 
    getReminders, 
    getRemindersByPatient,
    createReminder, 
    triggerManualScan, 
    deleteReminder, 
    updateReminderStatus,
    updateReminder
} from "../controllers/opdReminder.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission("access_opd"), getReminders);
router.get("/patient/:patientId", requirePermission("access_opd"), getRemindersByPatient);
router.post("/", requirePermission("access_opd"), createReminder);
router.post("/scan", requirePermission("access_opd"), triggerManualScan);
router.put("/:id", requirePermission("access_opd"), updateReminder);
router.patch("/:id/status", requirePermission("access_opd"), updateReminderStatus);
router.delete("/:id", requirePermission("access_opd"), deleteReminder);

export default router;
