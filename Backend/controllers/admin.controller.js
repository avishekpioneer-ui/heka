import CoachingCenter from "../models/CoachingCenter.js";
import Course from "../models/Course.js";
import CourseAssignment from "../models/CourseAssignment.js";
import User from "../models/User.js";

// ==================== USER OPERATIONS ====================

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('name email category createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Users retrieved successfully",
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== COACHING CENTER OPERATIONS ====================

export const createCoachingCenter = async (req, res) => {
    try {
        const { name, address, pincode, mobileNumber } = req.body;

        if (!name || !address || !pincode || !mobileNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingCenter = await CoachingCenter.findOne({ name });
        if (existingCenter) {
            return res.status(409).json({ message: "Coaching center with this name already exists" });
        }

        const coachingCenter = await CoachingCenter.create({
            name,
            address,
            pincode,
            mobileNumber,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: "Coaching center created successfully",
            coachingCenter
        });
    } catch (error) {
        console.error("Create Coaching Center Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllCoachingCenters = async (req, res) => {
    try {
        const coachingCenters = await CoachingCenter.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Coaching Centres retrieved successfully",
            count: coachingCenters.length,
            coachingCenters
        });
    } catch (error) {
        console.error("Get Coaching Centres Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateCoachingCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, pincode, mobileNumber, isActive } = req.body;

        const coachingCenter = await CoachingCenter.findById(id);
        if (!coachingCenter) {
            return res.status(404).json({ message: "Coaching center not found" });
        }

        // Check if new name conflicts with another center
        if (name && name !== coachingCenter.name) {
            const duplicate = await CoachingCenter.findOne({ name });
            if (duplicate) {
                return res.status(409).json({ message: "Coaching center with this name already exists" });
            }
        }

        const updated = await CoachingCenter.findByIdAndUpdate(
            id,
            { name, address, pincode, mobileNumber, isActive },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Coaching center updated successfully",
            coachingCenter: updated
        });
    } catch (error) {
        console.error("Update Coaching Center Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteCoachingCenter = async (req, res) => {
    try {
        const { id } = req.params;

        const coachingCenter = await CoachingCenter.findById(id);
        if (!coachingCenter) {
            return res.status(404).json({ message: "Coaching center not found" });
        }

        // Check if there are any course assignments for this center
        const assignments = await CourseAssignment.find({ coachingCenterId: id });
        if (assignments.length > 0) {
            return res.status(400).json({
                message: "Cannot delete coaching center with assigned courses. Please remove all course assignments first."
            });
        }

        await CoachingCenter.findByIdAndDelete(id);

        res.status(200).json({
            message: "Coaching center deleted successfully"
        });
    } catch (error) {
        console.error("Delete Coaching Center Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== COURSE OPERATIONS ====================

export const createCourse = async (req, res) => {
    try {
        const { courseName, description, duration, certificateAvailable } = req.body;

        if (!courseName || !description || !duration) {
            return res.status(400).json({ message: "Course name, description, and duration are required" });
        }

        const existingCourse = await Course.findOne({ courseName });
        if (existingCourse) {
            return res.status(409).json({ message: "Course with this name already exists" });
        }

        const course = await Course.create({
            courseName,
            description,
            duration,
            certificateAvailable: certificateAvailable || false,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: "Course created successfully",
            course
        });
    } catch (error) {
        console.error("Create Course Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Courses retrieved successfully",
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error("Get Courses Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseName, description, duration, certificateAvailable, isActive } = req.body;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if new name conflicts with another course
        if (courseName && courseName !== course.courseName) {
            const duplicate = await Course.findOne({ courseName });
            if (duplicate) {
                return res.status(409).json({ message: "Course with this name already exists" });
            }
        }

        const updated = await Course.findByIdAndUpdate(
            id,
            { courseName, description, duration, certificateAvailable, isActive },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Course updated successfully",
            course: updated
        });
    } catch (error) {
        console.error("Update Course Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Check if there are any assignments for this course
        const assignments = await CourseAssignment.find({ courseId: id });
        if (assignments.length > 0) {
            return res.status(400).json({
                message: "Cannot delete course with active assignments. Please remove all assignments first."
            });
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            message: "Course deleted successfully"
        });
    } catch (error) {
        console.error("Delete Course Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== COURSE ASSIGNMENT OPERATIONS ====================

export const assignCourseToCenter = async (req, res) => {
    try {
        const { courseId, coachingCenterId, price } = req.body;

        if (!courseId || !coachingCenterId || price === undefined) {
            return res.status(400).json({ message: "Course, coaching center, and price are required" });
        }

        // Verify course and coaching center exist
        const course = await Course.findById(courseId);
        const center = await CoachingCenter.findById(coachingCenterId);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (!center) {
            return res.status(404).json({ message: "Coaching center not found" });
        }

        // Check if assignment already exists
        const existingAssignment = await CourseAssignment.findOne({ courseId, coachingCenterId });
        if (existingAssignment) {
            return res.status(409).json({ message: "This course is already assigned to this coaching center" });
        }

        const assignment = await CourseAssignment.create({
            courseId,
            coachingCenterId,
            price,
            assignedBy: req.user._id
        });

        const populatedAssignment = await CourseAssignment.findById(assignment._id)
            .populate('courseId', 'courseName duration certificateAvailable')
            .populate('coachingCenterId', 'name address');

        res.status(201).json({
            message: "Course assigned to coaching center successfully",
            assignment: populatedAssignment
        });
    } catch (error) {
        console.error("Assign Course Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateCourseAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { price, isActive } = req.body;

        const assignment = await CourseAssignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        const updated = await CourseAssignment.findByIdAndUpdate(
            id,
            { price, isActive },
            { new: true, runValidators: true }
        )
            .populate('courseId', 'courseName duration certificateAvailable')
            .populate('coachingCenterId', 'name address');

        res.status(200).json({
            message: "Assignment updated successfully",
            assignment: updated
        });
    } catch (error) {
        console.error("Update Assignment Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCoursesByCenter = async (req, res) => {
    try {
        const { centerId } = req.params;

        const center = await CoachingCenter.findById(centerId);
        if (!center) {
            return res.status(404).json({ message: "Coaching center not found" });
        }

        const assignments = await CourseAssignment.find({ coachingCenterId: centerId })
            .populate('courseId', 'courseName description duration certificateAvailable')
            .populate('coachingCenterId', 'name address')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Courses retrieved successfully",
            coachingCenter: center,
            count: assignments.length,
            assignments
        });
    } catch (error) {
        console.error("Get Courses By Center Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getCentersByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const assignments = await CourseAssignment.find({ courseId })
            .populate('courseId', 'courseName description duration certificateAvailable')
            .populate('coachingCenterId', 'name address pincode mobileNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Coaching centres retrieved successfully",
            course: course,
            count: assignments.length,
            assignments
        });
    } catch (error) {
        console.error("Get Centers By Course Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllAssignments = async (req, res) => {
    try {
        const assignments = await CourseAssignment.find()
            .populate('courseId', 'courseName description duration certificateAvailable')
            .populate('coachingCenterId', 'name address')
            .populate('assignedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "All assignments retrieved successfully",
            count: assignments.length,
            assignments
        });
    } catch (error) {
        console.error("Get All Assignments Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const removeAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const assignment = await CourseAssignment.findById(id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        await CourseAssignment.findByIdAndDelete(id);

        res.status(200).json({
            message: "Assignment removed successfully"
        });
    } catch (error) {
        console.error("Remove Assignment Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==================== PAYMENT SETTINGS ====================
import PaymentSettings from "../models/PaymentSettings.js";

export const getPaymentSettings = async (req, res) => {
    try {
        let settings = await PaymentSettings.findOne();
        if (!settings) {
            // Return empty defaults if never configured
            settings = {};
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Get Payment Settings Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updatePaymentSettings = async (req, res) => {
    try {
        const { accountName, bankName, accountNumber, ifsc, upiId, qrImageUrl, notes } = req.body;

        // Upsert — create the single document if it doesn't exist, else update it
        const settings = await PaymentSettings.findOneAndUpdate(
            {},
            { accountName, bankName, accountNumber, ifsc, upiId, qrImageUrl, notes },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, message: "Payment settings updated", data: settings });
    } catch (error) {
        console.error("Update Payment Settings Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
