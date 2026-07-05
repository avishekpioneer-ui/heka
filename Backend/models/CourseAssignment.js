import mongoose from "mongoose";

const courseAssignmentSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, "Course is required"]
        },
        coachingCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CoachingCenter',
            required: [true, "Coaching center is required"]
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        isActive: {
            type: Boolean,
            default: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

// Ensure a course can only be assigned once to a coaching center
courseAssignmentSchema.index({ courseId: 1, coachingCenterId: 1 }, { unique: true });

export default mongoose.model("CourseAssignment", courseAssignmentSchema);
