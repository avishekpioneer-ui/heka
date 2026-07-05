import mongoose from "mongoose";

const coachingCenterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Coaching center name is required"],
            trim: true,
            unique: true
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true
        },
        pincode: {
            type: String,
            required: [true, "Pincode is required"],
            trim: true,
            match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
        },
        mobileNumber: {
            type: String,
            required: [true, "Mobile number is required"],
            trim: true,
            match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"]
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("CoachingCenter", coachingCenterSchema);
