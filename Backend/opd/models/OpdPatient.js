import mongoose from "mongoose";

const opdPatientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: ""
        },
        gender: {
            type: String,
            enum: ["Male", "Female", "Other"],
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdPatient", opdPatientSchema);
