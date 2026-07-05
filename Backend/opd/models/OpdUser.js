import mongoose from "mongoose";

const opdUserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OpdRole",
            required: false // Optional for super admin if they are registered locally, or we fall back
        },
        category: {
            type: String,
            default: "staff"
        },
        isDoctor: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdUser", opdUserSchema);
