import OpdConsultation from "../models/OpdConsultation.js";
import OpdAppointment from "../models/OpdAppointment.js";
import { emitOpdEvent } from "../socket.js";

export const createConsultation = async (req, res) => {
    try {
        const { appointmentId, patientId, doctorId, doctorName, symptoms, diagnosis, prescription, followUpDate } = req.body;

        if (!appointmentId || !patientId || !doctorName) {
            return res.status(400).json({ message: "Appointment, Patient, and Doctor details are required" });
        }

        // Create consultation record
        const consultation = await OpdConsultation.create({
            appointmentId,
            patientId,
            doctorId: doctorId || undefined,
            doctorName,
            symptoms: symptoms || "",
            diagnosis: diagnosis || "",
            prescription: prescription || [],
            followUpDate: followUpDate || null
        });

        // Auto-complete the linked appointment
        const appointment = await OpdAppointment.findByIdAndUpdate(appointmentId, { status: "Completed" }, { new: true });

        emitOpdEvent("opd:consultation", { type: "created", consultation });
        if (appointment) {
            emitOpdEvent("opd:appointment", { type: "updated", appointment });
        }

        res.status(201).json({ message: "Consultation prescription generated successfully", consultation });
    } catch (error) {
        console.error("Create Consultation Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getConsultations = async (req, res) => {
    try {
        const consultations = await OpdConsultation.find({})
            .populate("patientId")
            .populate("appointmentId")
            .sort({ createdAt: -1 });
        res.status(200).json(consultations);
    } catch (error) {
        console.error("Get Consultations Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getConsultationsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const consultations = await OpdConsultation.find({ patientId })
            .populate("appointmentId")
            .sort({ createdAt: -1 });
        res.status(200).json(consultations);
    } catch (error) {
        console.error("Get Patient Consultations Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
