import express from "express";
import { createConsultation, getConsultations, getConsultationsByPatient } from "../controllers/opdConsultation.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission("consultations:add"), createConsultation);
router.get("/", requirePermission(["consultations:read", "billing:read"]), getConsultations);
router.get("/patient/:patientId", requirePermission(["consultations:read", "billing:read"]), getConsultationsByPatient);

export default router;
