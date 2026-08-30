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

opdAppointmentSchema.index({ appointmentDate: -1 });
opdAppointmentSchema.index({ patientId: 1 });
opdAppointmentSchema.index({ doctorId: 1 });
opdAppointmentSchema.index({ status: 1 });

export default mongoose.model("OpdAppointment", opdAppointmentSchema);
