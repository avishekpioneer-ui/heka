import mongoose from "mongoose";

const opdReminderSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdPatient",
            required: true
        },
        followUpDate: {
            type: Date,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            default: "Sent"
        },
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdBilling",
            required: false
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdAppointment",
            required: false
        }
    },
    { timestamps: true }
);

opdReminderSchema.index({ followUpDate: -1 });
opdReminderSchema.index({ patientId: 1 });
opdReminderSchema.index({ billId: 1 });

export default mongoose.model("OpdReminder", opdReminderSchema);
