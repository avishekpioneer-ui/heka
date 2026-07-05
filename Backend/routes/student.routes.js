import express from "express";
import {
    registerStudent,
    getAllStudents,
    getMyProfile,
    submitPayment,
    approveStudent,
    updateStudentStatus
} from "../controllers/student.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: Register student
router.post("/register", registerStudent);

// Admin: Get all students
router.get("/", verifyAdmin, getAllStudents);

// Student: Get own profile by email
router.get("/my-profile", getMyProfile);

// Student: Submit payment transaction ID
router.post("/submit-payment", submitPayment);

// Admin: Approve student payment
router.put("/:id/approve", verifyAdmin, approveStudent);

// Admin: Update student application status
router.put("/:id/status", verifyAdmin, updateStudentStatus);

export default router;
