import OpdPatient from "../models/OpdPatient.js";
import OpdAppointment from "../models/OpdAppointment.js";
import OpdConsultation from "../models/OpdConsultation.js";
import OpdBilling from "../models/OpdBilling.js";

export const getDashboardStats = async (req, res) => {
    try {
        const isDoctor = req.user?.isDoctor || (req.user?.roleName ? req.user.roleName.toLowerCase().includes("doctor") : false);
        const isAdmin = req.user?.category === "admin" || req.user?.permissions?.includes("*");

        let doctorAppointmentQuery = {};
        let doctorConsultationQuery = {};

        if (isDoctor && !isAdmin && req.user) {
            const docFilter = [
                { doctorId: req.user.id },
                { doctorName: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
            ];
            doctorAppointmentQuery = { $or: docFilter };
            doctorConsultationQuery = { $or: docFilter };
        }

        // Run fast parallel count queries and fetch only top 5 recent appointments
        const [
            patientsCount,
            appointmentsCount,
            consultationsCount,
            billingPendingCount,
            billingPaidCount,
            recentAppointments
        ] = await Promise.all([
            OpdPatient.countDocuments(),
            OpdAppointment.countDocuments(doctorAppointmentQuery),
            OpdConsultation.countDocuments(doctorConsultationQuery),
            OpdBilling.countDocuments({ status: "Pending" }),
            OpdBilling.countDocuments({ status: "Paid" }),
            OpdAppointment.find(doctorAppointmentQuery)
                .populate("patientId", "name phone age gender")
                .sort({ appointmentDate: -1 })
                .limit(5)
                .lean()
        ]);

        res.status(200).json({
            stats: {
                patients: patientsCount,
                appointments: appointmentsCount,
                consultations: consultationsCount,
                billingPending: billingPendingCount,
                billingPaid: billingPaidCount
            },
            recentAppointments
        });
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
