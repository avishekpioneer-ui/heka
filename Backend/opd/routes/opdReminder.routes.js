import express from "express";
import { getReminders, triggerManualScan } from "../controllers/opdReminder.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission("access_opd"), getReminders);
router.post("/scan", requirePermission("access_opd"), triggerManualScan);

export default router;
