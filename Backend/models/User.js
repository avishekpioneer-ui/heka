import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['normal', 'student', 'admin'],
            default: 'normal'
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
