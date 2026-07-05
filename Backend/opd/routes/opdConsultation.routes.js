import express from "express";
import { createConsultation, getConsultations, getConsultationsByPatient } from "../controllers/opdConsultation.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("manage_consultations"), createConsultation);
router.get("/", requirePermission(["manage_consultations", "manage_billing"]), getConsultations);
router.get("/patient/:patientId", requirePermission(["manage_consultations", "manage_billing"]), getConsultationsByPatient);

export default router;
