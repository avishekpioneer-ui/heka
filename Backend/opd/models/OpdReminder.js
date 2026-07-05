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
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdReminder", opdReminderSchema);
