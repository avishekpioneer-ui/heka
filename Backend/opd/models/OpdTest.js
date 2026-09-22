import mongoose from "mongoose";

const opdTestSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        code: {
            type: String,
            trim: true
        },
        category: {
            type: String,
            trim: true,
            default: "General Pathology"
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdTest", opdTestSchema);
