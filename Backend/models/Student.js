import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
    degreeOrClass: {
        type: String,
        required: false
    },
    institute: {
        type: String,
        required: false
    },
    boardOrUniversity: {
        type: String,
        required: false
    },
    passingYear: {
        type: Number,
        required: false
    },
    marksOrGrade: {
        type: String,
        required: false
    },
    stream: {
        type: String,
        required: false
    }
}, { _id: false });

const workExperienceSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: false
    },
    designation: {
        type: String,
        required: false
    },
    reportingPerson: {
        type: String,
        required: false
    },
    reportingContact: {
        type: String,
        required: false
    },
    jobResponsibilities: {
        type: String,
        required: false
    }
}, { _id: false });

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        coachingCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CoachingCenter',
            required: true
        },
        courseFee: {
            type: Number,
            required: true
        },
        coachingCourseId: {
            type: Number,
            required: false
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },
        fatherOrMotherName: {
            type: String,
            required: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        alternatePhoneNumber: {
            type: String,
            required: false
        },
        aadharNumber: {
            type: String,
            required: true
        },
        permanentAddress: {
            type: String,
            required: true
        },
        educations: [educationSchema],
        workExperiences: [workExperienceSchema],
        applicationStatus: {
            type: String,
            enum: ['Submitted(Payment not initiated)', 'Submitted(Payment initiated)', 'Approved', 'Reject'],
            default: 'Submitted(Payment not initiated)'
        },
        transactionId: {
            type: String,
            default: null
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'submitted', 'verified'],
            default: 'unpaid'
        }
    },
    { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
