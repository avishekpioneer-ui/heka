import mongoose from "mongoose";

const opdAppointmentSchema = new mongoose.Schema(
    {
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
        appointmentDate: {
            type: Date,
            required: true
        },
        consultationFee: {
            type: Number,
            required: true,
            default: 0
        },
        status: {
            type: String,
            enum: ["Scheduled", "Completed", "Cancelled"],
            default: "Scheduled"
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdAppointment", opdAppointmentSchema);
