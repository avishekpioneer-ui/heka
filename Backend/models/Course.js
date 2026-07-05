import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        courseName: {
            type: String,
            required: [true, "Course name is required"],
            trim: true,
            unique: true
        },
        description: {
            type: String,
            required: [true, "Course description is required"],
            trim: true
        },
        duration: {
            type: String,
            required: [true, "Course duration is required"],
            trim: true
        },
        certificateAvailable: {
            type: Boolean,
            required: true,
            default: false
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

export default mongoose.model("Course", courseSchema);
