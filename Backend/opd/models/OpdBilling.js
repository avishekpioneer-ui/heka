import mongoose from "mongoose";

const billedTestSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OpdTest",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });

const billedMedicineSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OpdMedicine",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    }
}, { _id: false });

const opdBillingSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdPatient",
            required: true
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdAppointment",
            required: false
        },
        consultationFee: {
            type: Number,
            default: 0
        },
        tests: [billedTestSchema],
        medicines: [billedMedicineSchema],
        totalAmount: {
            type: Number,
            required: true,
            default: 0
        },
        status: {
            type: String,
            enum: ["Pending", "Paid"],
            default: "Pending"
        },
        billingType: {
            type: String,
            enum: ["Consultation", "Diagnostic", "Pharmacy", "Combined"],
            default: "Combined"
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdBilling", opdBillingSchema);
