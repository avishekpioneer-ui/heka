import Course from "../models/Course.js";
import CoachingCenter from "../models/CoachingCenter.js";
import CourseAssignment from "../models/CourseAssignment.js";
import PaymentSettings from "../models/PaymentSettings.js";

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
