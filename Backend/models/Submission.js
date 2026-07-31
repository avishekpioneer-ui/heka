import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        formType: {
            type: String,
            required: [true, "Form type is required"],
            trim: true
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: [true, "Phone is required"],
            trim: true
        },
        // Optional fields, present depending on which form was submitted
        role: { type: String, trim: true },
        district: { type: String, trim: true },
        type: { type: String, trim: true },
        subject: { type: String, trim: true },
        message: { type: String, trim: true },
        amount: { type: Number },
        frequency: { type: String, trim: true },
        panNumber: { type: String, trim: true, uppercase: true }
    },
    { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
