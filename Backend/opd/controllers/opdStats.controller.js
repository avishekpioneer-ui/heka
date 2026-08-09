import OpdPatient from "../models/OpdPatient.js";
import OpdAppointment from "../models/OpdAppointment.js";
import OpdConsultation from "../models/OpdConsultation.js";
import OpdBilling from "../models/OpdBilling.js";
import OpdUser from "../models/OpdUser.js";

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        let apptFilter = {};
        let consultFilter = {};

        if (userId) {
            const user = await OpdUser.findById(userId);
            if (user && user.roleId && user.roleId.name && user.roleId.name.toLowerCase() === "doctor") {
                apptFilter = { doctorId: user._id };
                consultFilter = { doctorId: user._id };
            }
        }

        const [patients, appointments, consultations, billingPending, billingPaid] = await Promise.all([
            OpdPatient.countDocuments(),
            OpdAppointment.countDocuments(apptFilter),
            OpdConsultation.countDocuments(consultFilter),
            OpdBilling.countDocuments({ status: "Pending" }),
            OpdBilling.countDocuments({ status: "Paid" })
        ]);

        return res.status(200).json({
            patients,
            appointments,
            consultations,
            billingPending,
            billingPaid
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
    }
};
