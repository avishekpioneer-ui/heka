import express from "express";
import { registerPatient, getPatients, getPatientById, updatePatient, deletePatient } from "../controllers/opdPatient.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("patients:add"), registerPatient);
router.get("/", requirePermission("patients:read"), getPatients);
router.get("/:id", requirePermission("patients:read"), getPatientById);
router.put("/:id", requirePermission("patients:edit"), updatePatient);
router.delete("/:id", requirePermission("patients:delete"), deletePatient);

export default router;
