import OpdAppointment from "../models/OpdAppointment.js";
import OpdBilling from "../models/OpdBilling.js";
import OpdUser from "../models/OpdUser.js";
import { emitOpdEvent } from "../socket.js";

export const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, doctorName, appointmentDate, consultationFee } = req.body;

        let resolvedDoctorName = doctorName;
        if (doctorId) {
            const doctor = await OpdUser.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: "Selected doctor not found" });
            }
            resolvedDoctorName = doctor.name;
        }

        if (!patientId || !resolvedDoctorName || !appointmentDate) {
            return res.status(400).json({ message: "Patient, Doctor, and Appointment date are required" });
        }

        const appointment = await OpdAppointment.create({
            patientId,
            doctorId: doctorId || undefined,
            doctorName: resolvedDoctorName,
            appointmentDate,
            consultationFee: consultationFee || 0,
            status: "Scheduled"
        });

        // Automatically pre-generate a consultation billing record for convenience!
        // This links the patient, appointment, and consultation fee in a "Pending" status.
        await OpdBilling.create({
            patientId,
            appointmentId: appointment._id,
            consultationFee: consultationFee || 0,
            totalAmount: consultationFee || 0,
            status: "Pending",
            billingType: "Consultation"
        });

        emitOpdEvent("opd:appointment", { type: "created", appointment });

        res.status(201).json({ message: "Appointment booked successfully", appointment });
    } catch (error) {
        console.error("Book Appointment Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAppointments = async (req, res) => {
    try {
        const appointments = await OpdAppointment.find({})
            .populate("patientId")
            .sort({ appointmentDate: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Get Appointments Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const appointment = await OpdAppointment.findByIdAndUpdate(id, { status }, { new: true });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        emitOpdEvent("opd:appointment", { type: "updated", appointment });

        res.status(200).json({ message: `Appointment marked as ${status}`, appointment });
    } catch (error) {
        console.error("Update Appointment Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
