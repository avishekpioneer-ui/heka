import mongoose from "mongoose";

const opdRoleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        permissions: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdRole", opdRoleSchema);
