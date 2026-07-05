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
        followUpDate: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdConsultation", opdConsultationSchema);
