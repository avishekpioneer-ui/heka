import express from "express";
import { verifyAdmin } from "../middleware/auth.middleware.js";
import {
    // Coaching Center Controllers
    createCoachingCenter,
    getAllCoachingCenters,
    updateCoachingCenter,
    deleteCoachingCenter,

    // Course Controllers
    createCourse,
    getAllCourses,
    updateCourse,
    deleteCourse,

    // Course Assignment Controllers
    assignCourseToCenter,
    updateCourseAssignment,
    getCoursesByCenter,
    getCentersByCourse,
    getAllAssignments,
    removeAssignment,

    // User Controllers
    getAllUsers,

    // Payment Settings Controllers
    getPaymentSettings,
    updatePaymentSettings
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdmin);

// ==================== COACHING CENTER ROUTES ====================
router.post("/coaching-centers", createCoachingCenter);
router.get("/coaching-centers", getAllCoachingCenters);
router.put("/coaching-centers/:id", updateCoachingCenter);
router.delete("/coaching-centers/:id", deleteCoachingCenter);

// ==================== COURSE ROUTES ====================
router.post("/courses", createCourse);
router.get("/courses", getAllCourses);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// ==================== COURSE ASSIGNMENT ROUTES ====================
router.post("/assignments", assignCourseToCenter);
router.get("/assignments", getAllAssignments);
router.get("/assignments/center/:centerId", getCoursesByCenter);
router.get("/assignments/course/:courseId", getCentersByCourse);
router.put("/assignments/:id", updateCourseAssignment);
router.delete("/assignments/:id", removeAssignment);

// ==================== USER ROUTES ====================
router.get("/users", getAllUsers);

// ==================== PAYMENT SETTINGS ROUTES ====================
router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);

export default router;
