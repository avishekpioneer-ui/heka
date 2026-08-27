import OpdReminder from "../models/OpdReminder.js";
import OpdPatient from "../models/OpdPatient.js";
import { scanAndSendReminders } from "../services/reminder.service.js";
import { emitOpdEvent } from "../socket.js";

export const createReminder = async (req, res) => {
    try {
        const { patientId, followUpDate, scheduledDate, message } = req.body;

        if (!patientId || !message) {
            return res.status(400).json({ message: "Patient ID and message are required" });
        }

        const patient = await OpdPatient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const reminderDate = followUpDate || scheduledDate || new Date();

        const reminder = await OpdReminder.create({
            patientId,
            followUpDate: reminderDate,
            message,
            status: "Scheduled"
        });

        emitOpdEvent("opd:reminder", { 
            type: "created", 
            reminder: { ...reminder.toObject(), patientId: patient } 
        });

        res.status(201).json({ message: "Reminder scheduled successfully", reminder });
    } catch (error) {
        console.error("Create Reminder Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getReminders = async (req, res) => {
    try {
        const reminders = await OpdReminder.find({})
            .populate("patientId")
            .sort({ sentAt: -1 });
        res.status(200).json(reminders);
    } catch (error) {
        console.error("Get Reminders Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const triggerManualScan = async (req, res) => {
    try {
        const count = await scanAndSendReminders();
        res.status(200).json({ 
            message: "Scan executed successfully", 
            remindersSent: count 
        });
    } catch (error) {
        console.error("Manual Reminder Scan Error:", error);
        res.status(500).json({ message: "Error executing scan engine" });
    }
};
