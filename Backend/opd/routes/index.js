import express from "express";
import authRoutes from "./opdAuth.routes.js";
import patientRoutes from "./opdPatient.routes.js";
import appointmentRoutes from "./opdAppointment.routes.js";
import consultationRoutes from "./opdConsultation.routes.js";
import testRoutes from "./opdTest.routes.js";
import testOrderRoutes from "./opdTestOrder.routes.js";
import medicineRoutes from "./opdMedicine.routes.js";
import billingRoutes from "./opdBilling.routes.js";
import roleRoutes from "./opdRole.routes.js";
import reminderRoutes from "./opdReminder.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/consultations", consultationRoutes);
router.use("/tests", testRoutes);
router.use("/test-orders", testOrderRoutes);
router.use("/medicines", medicineRoutes);
router.use("/billing", billingRoutes);
router.use("/staff", roleRoutes); // Registers both roles & staff routes
router.use("/reminders", reminderRoutes);

export default router;
