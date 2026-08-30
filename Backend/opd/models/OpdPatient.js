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
            trim: true,
            default: ""
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

opdPatientSchema.index({ createdAt: -1 });
const OpdPatient = mongoose.model("OpdPatient", opdPatientSchema);

// Safely drop any legacy unique index on phone so registrations without phone or shared phones succeed
OpdPatient.collection.dropIndex("phone_1").catch(() => {});

export default OpdPatient;
