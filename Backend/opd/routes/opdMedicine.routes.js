import express from "express";
import { createMedicine, getMedicines, updateMedicine, deleteMedicine, restockMedicine } from "../controllers/opdMedicine.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission(["medicines:read", "consultations:read", "consultations:add", "billing:read"]), getMedicines);
router.post("/", requirePermission("medicines:add"), createMedicine);
router.put("/:id", requirePermission("medicines:edit"), updateMedicine);
router.put("/:id/restock", requirePermission("medicines:edit"), restockMedicine);
router.delete("/:id", requirePermission("medicines:delete"), deleteMedicine);

export default router;
