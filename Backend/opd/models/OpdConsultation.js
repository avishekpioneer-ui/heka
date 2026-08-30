import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema({
    medicineName: {
        type: String,
        required: true
    },
    dosage: {
        type: String,
        required: true // e.g., "1-0-1" or "Once daily"
    },
    duration: {
        type: String,
        required: true // e.g., "5 days"
    }
}, { _id: false });

const recommendedTestSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OpdTest",
        required: false
    },
    testName: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        default: ""
    }
}, { _id: false });

const opdConsultationSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdAppointment",
            required: true
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdPatient",
            required: true
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdUser",
            required: false
        },
        doctorName: {
            type: String,
            required: true,
            trim: true
        },
        symptoms: {
            type: String,
            default: ""
        },
        diagnosis: {
            type: String,
            default: ""
        },
        prescription: [prescriptionItemSchema],
        tests: [recommendedTestSchema],
        followUpDate: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
);

opdConsultationSchema.index({ createdAt: -1 });
opdConsultationSchema.index({ appointmentId: 1 });
opdConsultationSchema.index({ patientId: 1 });
opdConsultationSchema.index({ doctorId: 1 });

export default mongoose.model("OpdConsultation", opdConsultationSchema);
