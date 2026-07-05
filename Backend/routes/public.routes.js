import express from "express";
import {
    getActiveCourses,
    getActiveCoachingCenters,
    getActiveAssignments,
    getPublicPaymentSettings
} from "../controllers/public.controller.js";

const router = express.Router();

// Public routes (No authentication required)
router.get("/courses", getActiveCourses);
router.get("/coaching-centers", getActiveCoachingCenters);
router.get("/assignments", getActiveAssignments);
router.get("/payment-settings", getPublicPaymentSettings);

export default router;
