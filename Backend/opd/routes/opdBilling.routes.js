import express from "express";
import { createBill, getBills, getBillById, updateBill, payBill } from "../controllers/opdBilling.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("manage_billing"), createBill);
router.get("/", requirePermission("manage_billing"), getBills);
router.get("/:id", requirePermission("manage_billing"), getBillById);
router.put("/:id", requirePermission("manage_billing"), updateBill);
router.put("/:id/pay", requirePermission("manage_billing"), payBill);

export default router;
