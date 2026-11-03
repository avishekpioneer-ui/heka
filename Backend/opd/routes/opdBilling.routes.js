import express from "express";
import { createBill, getBills, getBillById, updateBill, deleteBill, payBill, deletePayment, getBillingSummary } from "../controllers/opdBilling.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("billing:add"), createBill);
router.get("/summary", requirePermission(["reports:read", "billing:read"]), getBillingSummary);
router.get("/", requirePermission("billing:read"), getBills);
router.get("/:id", requirePermission("billing:read"), getBillById);
router.put("/:id", requirePermission("billing:edit"), updateBill);
router.delete("/:id", requirePermission("billing:delete"), deleteBill);
router.put("/:id/pay", requirePermission("billing:edit"), payBill);
router.post("/:id/payment", requirePermission("billing:edit"), payBill);
router.delete("/:id/payment/:paymentId", requirePermission("billing:edit"), deletePayment);

export default router;
