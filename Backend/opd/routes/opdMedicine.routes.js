import express from "express";
import { createMedicine, getMedicines, updateMedicine, deleteMedicine, restockMedicine } from "../controllers/opdMedicine.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission(["manage_medicines", "manage_consultations", "manage_billing"]), getMedicines);
router.post("/", requirePermission("manage_medicines"), createMedicine);
router.put("/:id", requirePermission("manage_medicines"), updateMedicine);
router.put("/:id/restock", requirePermission("manage_medicines"), restockMedicine);
router.delete("/:id", requirePermission("manage_medicines"), deleteMedicine);

export default router;
