import mongoose from "mongoose";
import OpdRole from "../opd/models/OpdRole.js";

const seedPredefinedRoles = async () => {
    try {
        const doctorRole = await OpdRole.findOne({ name: "Doctor" });
        if (!doctorRole) {
            await OpdRole.create({
                name: "Doctor",
                permissions: [
                    "access_opd",
                    "manage_patients",
                    "manage_appointments",
                    "manage_consultations"
                ]
            });
            console.log("✅ Predefined role 'Doctor' seeded successfully");
        }
    } catch (error) {
        console.error("❌ Error seeding predefined roles:", error.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
        await seedPredefinedRoles();
    } catch (error) {
        console.error("❌ MongoDB Error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
