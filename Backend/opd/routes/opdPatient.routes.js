import express from "express";
import { registerPatient, getPatients, getPatientById, updatePatient, deletePatient } from "../controllers/opdPatient.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("manage_patients"), registerPatient);
router.get("/", requirePermission("manage_patients"), getPatients);
router.get("/:id", requirePermission("manage_patients"), getPatientById);
router.put("/:id", requirePermission("manage_patients"), updatePatient);
router.delete("/:id", requirePermission("manage_patients"), deletePatient);

export default router;
