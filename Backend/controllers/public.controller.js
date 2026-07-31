import Course from "../models/Course.js";
import CoachingCenter from "../models/CoachingCenter.js";
import CourseAssignment from "../models/CourseAssignment.js";
import PaymentSettings from "../models/PaymentSettings.js";
import Submission from "../models/Submission.js";

// @desc    Get all active courses (Public)
// @route   GET /api/public/courses
// @access  Public
export const getActiveCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true }).select('courseName description duration certificateAvailable');

        res.status(200).json({
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error: error.message });
    }
};

// @desc    Get all active Coaching Centres (Public)
// @route   GET /api/public/coaching-centers
// @access  Public
export const getActiveCoachingCenters = async (req, res) => {
    try {
        const coachingCenters = await CoachingCenter.find({ isActive: true }).select('name address pincode mobileNumber');

        res.status(200).json({
            count: coachingCenters.length,
            coachingCenters
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching Coaching Centres", error: error.message });
    }
};

// @desc    Get active course assignments (Public)
// @route   GET /api/public/assignments
// @access  Public
export const getActiveAssignments = async (req, res) => {
    try {
        const assignments = await CourseAssignment.find({ isActive: true })
            .populate('courseId', 'courseName')
            .populate('coachingCenterId', 'name address')
            .select('courseId coachingCenterId price');

        res.status(200).json({
            count: assignments.length,
            assignments
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching assignments", error: error.message });
    }
};

// @desc    Get payment/bank account settings (Public — read-only for students)
// @route   GET /api/public/payment-settings
// @access  Public
export const getPublicPaymentSettings = async (req, res) => {
    try {
        const settings = await PaymentSettings.findOne().select('-__v');
        res.status(200).json({ success: true, data: settings || {} });
    } catch (error) {
        res.status(500).json({ message: "Error fetching payment settings", error: error.message });
    }
};

// @desc    Record a landing-site form submission (volunteer / contact / donation pledge)
// @route   POST /api/public/submissions
// @access  Public
export const createSubmission = async (req, res) => {
    try {
        const { formType } = req.body;

        if (!formType) {
            return res.status(400).json({ success: false, error: "Missing formType parameter." });
        }

        if (!req.body.name || !req.body.email || !req.body.phone) {
            return res.status(400).json({
                success: false,
                error: "Name, email, and phone are required fields."
            });
        }

        const submission = await Submission.create(req.body);

        res.status(201).json({
            success: true,
            message: "Submission received successfully.",
            data: submission
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};
