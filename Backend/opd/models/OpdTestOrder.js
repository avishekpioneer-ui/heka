import mongoose from "mongoose";

const opdTestOrderSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdPatient",
            required: true
        },
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdTest",
            required: true
        },
        testName: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        scheduledDate: {
            type: Date,
            required: false
        },
        notes: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Ordered", "Collected", "Reported"],
            default: "Ordered"
        },
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdBilling",
            required: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdTestOrder", opdTestOrderSchema);
