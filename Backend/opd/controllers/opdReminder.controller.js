import OpdReminder from "../models/OpdReminder.js";
import { scanAndSendReminders } from "../services/reminder.service.js";

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
