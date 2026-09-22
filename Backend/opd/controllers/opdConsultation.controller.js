import OpdConsultation from "../models/OpdConsultation.js";
import OpdAppointment from "../models/OpdAppointment.js";
import OpdReminder from "../models/OpdReminder.js";
import { emitOpdEvent } from "../socket.js";

export const createConsultation = async (req, res) => {
    try {
        const { appointmentId, patientId, doctorId, doctorName, symptoms, diagnosis, prescription, tests, followUpDate } = req.body;

        if (!appointmentId || !patientId || !doctorName) {
            return res.status(400).json({ message: "Appointment, Patient, and Doctor details are required" });
        }

        // Sanitize recommended tests
        let sanitizedTests = [];
        if (Array.isArray(tests)) {
            sanitizedTests = tests
                .map(t => {
                    if (typeof t === 'string') {
                        return { testName: t.trim(), notes: "" };
                    }
                    if (t && typeof t === 'object') {
                        const name = t.testName || t.name || "";
                        if (!name.trim()) return null;
                        return {
                            testId: t.testId || t._id || undefined,
                            testName: name.trim(),
                            notes: t.notes || ""
                        };
                    }
                    return null;
                })
                .filter(Boolean);
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
            tests: sanitizedTests,
            followUpDate: followUpDate || null
        });

        // Auto-complete the linked appointment
        const appointment = await OpdAppointment.findByIdAndUpdate(appointmentId, { status: "Completed" }, { new: true });

        const populatedConsultation = await OpdConsultation.findById(consultation._id)
            .populate("patientId")
            .populate("appointmentId");

        emitOpdEvent("opd:consultation", { type: "created", consultation: populatedConsultation || consultation });
        if (appointment) {
            emitOpdEvent("opd:appointment", { type: "updated", appointment });
        }

        // Auto-generate follow-up advisory reminder if followUpDate is set
        if (followUpDate) {
            try {
                const followDateObj = new Date(followUpDate);
                if (!isNaN(followDateObj.getTime())) {
                    const patientObj = populatedConsultation?.patientId;
                    const pName = patientObj?.name || "Patient";
                    const diagInfo = diagnosis ? ` for ${diagnosis}` : "";
                    const message = `Clinical follow-up advisory: Consult with Dr. ${doctorName}${diagInfo}. Advised revisit on ${followDateObj.toLocaleDateString()}.`;

                    const reminder = await OpdReminder.create({
                        patientId,
                        followUpDate: followDateObj,
                        message,
                        status: "Scheduled"
                    });

                    emitOpdEvent("opd:reminder", {
                        type: "created",
                        reminder: { ...reminder.toObject(), patientId: patientObj || patientId }
                    });
                }
            } catch (remErr) {
                console.error("Error auto-creating reminder from consultation:", remErr);
            }
        }

        res.status(201).json({ message: "Consultation prescription generated successfully", consultation: populatedConsultation || consultation });
    } catch (error) {
        console.error("Create Consultation Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getConsultations = async (req, res) => {
    try {
        let query = {};

        // If logged-in user is a Doctor (and not an admin with wildcard permissions), restrict query to their own consultations
        const isDoctor = req.user?.isDoctor || (req.user?.roleName ? req.user.roleName.toLowerCase().includes("doctor") : false);
        const isAdmin = req.user?.category === "admin" || req.user?.permissions?.includes("*");

        if (isDoctor && !isAdmin) {
            query = {
                $or: [
                    { doctorId: req.user.id },
                    { doctorName: new RegExp(`^${req.user.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
                ]
            };
        }

        const consultations = await OpdConsultation.find(query)
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
            .populate("patientId")
            .populate("appointmentId")
            .sort({ createdAt: -1 });
        res.status(200).json(consultations);
    } catch (error) {
        console.error("Get Patient Consultations Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
