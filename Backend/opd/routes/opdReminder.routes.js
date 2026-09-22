import express from "express";
import { 
    getReminders, 
    createReminder, 
    triggerManualScan, 
    deleteReminder, 
    updateReminderStatus,
    getRemindersByPatient,
    updateReminder
} from "../controllers/opdReminder.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission(["reminders:read", "access_opd"]), getReminders);
router.get("/patient/:patientId", requirePermission(["reminders:read", "access_opd"]), getRemindersByPatient);
router.post("/", requirePermission(["reminders:add", "access_opd"]), createReminder);
router.post("/scan", requirePermission(["reminders:add", "access_opd"]), triggerManualScan);
router.put("/:id", requirePermission(["reminders:edit", "access_opd"]), updateReminder);
router.patch("/:id/status", requirePermission(["reminders:edit", "access_opd"]), updateReminderStatus);
router.delete("/:id", requirePermission(["reminders:delete", "access_opd"]), deleteReminder);

export default router;
