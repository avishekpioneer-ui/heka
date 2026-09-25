import mongoose from "mongoose";

const billedTestSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OpdTest",
        required: false
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed"
    },
    scheduledDate: {
        type: Date,
        required: false
    },
    notes: {
        type: String,
        default: ""
    }
}, { _id: false });

const billedMedicineSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OpdMedicine",
        required: false
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
    },
    discount: {
        type: Number,
        default: 0
    },
    discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed"
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
        consultationDiscount: {
            type: Number,
            default: 0
        },
        consultationDiscountType: {
            type: String,
            enum: ["fixed", "percentage"],
            default: "fixed"
        },
        tests: [billedTestSchema],
        medicines: [billedMedicineSchema],
        subtotal: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        discountType: {
            type: String,
            enum: ["fixed", "percentage"],
            default: "fixed"
        },
        discountReason: {
            type: String,
            default: ""
        },
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

opdBillingSchema.index({ createdAt: -1 });
opdBillingSchema.index({ patientId: 1 });
opdBillingSchema.index({ status: 1 });
opdBillingSchema.index({ appointmentId: 1 });

export default mongoose.model("OpdBilling", opdBillingSchema);
