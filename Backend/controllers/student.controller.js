import User from "../models/User.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";

// Helper function to generate password from name and DOB
const generatePassword = (fullName, dateOfBirth) => {
    const nameWithoutSpaces = fullName.replace(/\s+/g, '');
    const namePrefix = nameWithoutSpaces.substring(0, 4);

    const date = new Date(dateOfBirth);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${namePrefix}${day}${month}${year}`;
};

export const registerStudent = async (req, res) => {
    try {
        const {
            fullName,
            email,
            dateOfBirth,
            courseType,
            coachingCenter,
            courseId,
            coachingCenterId,
            courseFee,
            coachingCourseId,
            gender,
            fatherOrMotherName,
            phoneNumber,
            alternatePhoneNumber,
            aadharNumber,
            permanentAddress,
            educations,
            workExperiences
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !dateOfBirth || !courseId || !coachingCenterId ||
            !gender || !fatherOrMotherName || !phoneNumber || !aadharNumber || !permanentAddress) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        // Check if user already exists
        let existingUser = await User.findOne({ email });
        let userId;
        let isExistingUser = false;
        let generatedPassword = null;

        if (existingUser) {
            isExistingUser = true;
            userId = existingUser._id;

            if (existingUser.category === 'normal') {
                existingUser.category = 'student';
                await existingUser.save();
            } else if (existingUser.category === 'admin') {
                return res.status(403).json({
                    message: "This email is already registered with admin privileges."
                });
            }
        } else {
            const autoPassword = generatePassword(fullName, dateOfBirth);
            generatedPassword = autoPassword;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(autoPassword, salt);

            const newUser = await User.create({
                name: fullName,
                email,
                password: hashedPassword,
                category: 'student'
            });

            userId = newUser._id;
        }

        // Check if student application already exists
        const existingStudent = await Student.findOne({ email });

        if (existingStudent) {
            existingStudent.fullName = fullName;
            existingStudent.userId = userId;
            existingStudent.courseId = courseId;
            existingStudent.coachingCenterId = coachingCenterId;
            existingStudent.courseFee = courseFee;
            existingStudent.coachingCourseId = coachingCourseId;
            existingStudent.dateOfBirth = dateOfBirth;
            existingStudent.gender = gender;
            existingStudent.fatherOrMotherName = fatherOrMotherName;
            existingStudent.phoneNumber = phoneNumber;
            existingStudent.alternatePhoneNumber = alternatePhoneNumber;
            existingStudent.aadharNumber = aadharNumber;
            existingStudent.permanentAddress = permanentAddress;
            existingStudent.educations = educations || [];
            existingStudent.workExperiences = workExperiences || [];

            await existingStudent.save();

            return res.status(200).json({
                message: isExistingUser
                    ? "Your admission application has been updated successfully. Please use your existing password to login."
                    : "Admission application updated successfully",
                isExistingUser,
                student: {
                    id: existingStudent._id,
                    fullName: existingStudent.fullName,
                    email: existingStudent.email,
                    courseId: existingStudent.courseId,
                    applicationStatus: existingStudent.applicationStatus
                }
            });
        }

        // Create new student record
        const student = await Student.create({
            userId,
            fullName,
            email,
            courseId,
            coachingCenterId,
            courseFee,
            coachingCourseId,
            dateOfBirth,
            gender,
            fatherOrMotherName,
            phoneNumber,
            alternatePhoneNumber,
            aadharNumber,
            permanentAddress,
            educations: educations || [],
            workExperiences: workExperiences || []
        });

        const response = {
            message: "Student admission application submitted successfully",
            isExistingUser,
            student: {
                id: student._id,
                fullName: student.fullName,
                email: student.email,
                applicationStatus: student.applicationStatus
            }
        };

        if (generatedPassword) {
            response.credentials = {
                email: student.email,
                password: generatedPassword,
                note: "Please save these credentials. You can use them to login."
            };
        }

        res.status(201).json(response);
    } catch (error) {
        console.error("Student Registration Error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

// ==================== GET ALL STUDENTS (Admin) ====================
export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('courseId', 'courseName duration')
            .populate('coachingCenterId', 'name address pincode mobileNumber')
            .sort({ createdAt: -1 });

        const formatted = students.map(s => ({
            ...s.toObject(),
            courseType: s.courseId?.courseName || '',
            coachingCenterName: s.coachingCenterId?.name || '',
            coachingCenterAddress: s.coachingCenterId?.address || '',
            coachingCenterPincode: s.coachingCenterId?.pincode || '',
            coachingCenterMobile: s.coachingCenterId?.mobileNumber || '',
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("Get All Students Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ==================== GET MY PROFILE (Student) ====================
// Identifies the student by email query param (since no JWT in this app)
export const getMyProfile = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const student = await Student.findOne({ email })
            .populate('courseId', 'courseName duration certificateAvailable description')
            .populate('coachingCenterId', 'name address pincode mobileNumber');

        if (!student) {
            return res.status(404).json({ success: false, message: "Student profile not found" });
        }

        res.status(200).json({ success: true, data: student });
    } catch (error) {
        console.error("Get My Profile Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==================== SUBMIT PAYMENT (Student) ====================
export const submitPayment = async (req, res) => {
    try {
        const { studentId, transactionId } = req.body;
        if (!studentId || !transactionId) {
            return res.status(400).json({ success: false, message: "studentId and transactionId are required" });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (student.applicationStatus === 'approved') {
            return res.status(400).json({ success: false, message: "Your payment is already verified and approved." });
        }

        student.transactionId = transactionId;
        student.paymentStatus = 'submitted';
        student.applicationStatus = 'Submitted(Payment initiated)';
        await student.save();

        res.status(200).json({
            success: true,
            message: "Transaction ID submitted successfully. Admin will verify your payment shortly.",
            data: {
                transactionId: student.transactionId,
                paymentStatus: student.paymentStatus
            }
        });
    } catch (error) {
        console.error("Submit Payment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==================== APPROVE STUDENT (Admin) ====================
export const approveStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        student.applicationStatus = 'Approved';
        student.paymentStatus = 'verified';
        await student.save();

        res.status(200).json({
            success: true,
            message: "Student payment approved successfully",
            data: {
                applicationStatus: student.applicationStatus,
                paymentStatus: student.paymentStatus
            }
        });
    } catch (error) {
        console.error("Approve Student Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==================== UPDATE STUDENT STATUS (Admin) ====================
export const updateStudentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Submitted(Payment not initiated)', 'Submitted(Payment initiated)', 'Approved', 'Reject'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        student.applicationStatus = status;

        // Sync paymentStatus for consistency if needed
        if (status === 'Approved') {
            student.paymentStatus = 'verified';
        }

        await student.save();

        res.status(200).json({
            success: true,
            message: `Student status updated to ${status} successfully`,
            data: {
                applicationStatus: student.applicationStatus,
                paymentStatus: student.paymentStatus
            }
        });
    } catch (error) {
        console.error("Update Student Status Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
