import mongoose from "mongoose";

const opdPaymentPartSchema = new mongoose.Schema(
    {
        partNumber: {
            type: Number,
            required: true,
            default: 1
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, "Amount must be greater than zero"]
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        paymentMode: {
            type: String,
            enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Card", "Other"],
            default: "Cash"
        },
        transactionId: {
            type: String,
            default: "",
            trim: true
        },
        notes: {
            type: String,
            default: "",
            trim: true
        },
        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdUser"
        }
    },
    { timestamps: true }
);

const opdSalarySchema = new mongoose.Schema(
    {
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdUser",
            required: true
        },
        month: {
            type: String, // Format: "YYYY-MM" (e.g. "2026-09")
            required: true,
            trim: true
        },
        baseSalary: {
            type: Number,
            default: 0
        },
        isCustomSalary: {
            type: Boolean,
            default: false
        },
        carriedOverBalance: {
            type: Number,
            default: 0 // positive = previous unpaid arrears, negative = previous advance deduction
        },
        netPayable: {
            type: Number,
            default: 0 // baseSalary + carriedOverBalance
        },
        payments: [opdPaymentPartSchema], // Merged part-by-part installment payments
        totalPaid: {
            type: Number,
            default: 0
        },
        remainingBalance: {
            type: Number,
            default: 0 // netPayable - totalPaid
        },
        status: {
            type: String,
            enum: ["Unpaid", "Partially Paid", "Paid", "Overpaid"],
            default: "Unpaid"
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

// Unique compound index to ensure one salary record per staff per month
opdSalarySchema.index({ staffId: 1, month: 1 }, { unique: true });

export default mongoose.model("OpdSalary", opdSalarySchema);
