import mongoose from "mongoose";

const opdMedicineSchema = new mongoose.Schema(
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
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    { timestamps: true }
);

export default mongoose.model("OpdMedicine", opdMedicineSchema);
