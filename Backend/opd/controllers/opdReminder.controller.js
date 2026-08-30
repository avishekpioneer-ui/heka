import OpdReminder from "../models/OpdReminder.js";
import OpdPatient from "../models/OpdPatient.js";
import { scanAndSendReminders } from "../services/reminder.service.js";
import { emitOpdEvent } from "../socket.js";

export const createReminder = async (req, res) => {
    try {
        const { patientId, followUpDate, scheduledDate, message, note } = req.body;

        const reminderMessage = message || note;
        if (!patientId || !reminderMessage) {
            return res.status(400).json({ message: "Patient and reminder note/message are required" });
        }

        const patient = await OpdPatient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const reminderDate = followUpDate || scheduledDate || new Date();

        const reminder = await OpdReminder.create({
            patientId,
            followUpDate: reminderDate,
            message: reminderMessage,
            status: "Scheduled"
        });

        const populatedReminder = await OpdReminder.findById(reminder._id).populate("patientId");

        emitOpdEvent("opd:reminder", { 
            type: "created", 
            reminder: populatedReminder ? populatedReminder.toObject() : { ...reminder.toObject(), patientId }
        });

        res.status(201).json({ message: "Reminder scheduled successfully", reminder: populatedReminder || reminder });
    } catch (error) {
        console.error("Create Reminder Error:", error);
        res.status(500).json({ message: "Server error creating reminder" });
    }
};

export const getReminders = async (req, res) => {
    try {
        const reminders = await OpdReminder.find({})
            .populate("patientId")
            .sort({ followUpDate: 1, createdAt: 1 });
        res.status(200).json(reminders);
    } catch (error) {
        console.error("Get Reminders Error:", error);
        res.status(500).json({ message: "Server error fetching reminders" });
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

export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const reminder = await OpdReminder.findByIdAndDelete(id);
        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }

        emitOpdEvent("opd:reminder", {
            type: "deleted",
            reminderId: id
        });

        res.status(200).json({ message: "Reminder deleted successfully", id });
    } catch (error) {
        console.error("Delete Reminder Error:", error);
        res.status(500).json({ message: "Server error deleting reminder" });
    }
};

export const updateReminderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const reminder = await OpdReminder.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("patientId");

        if (!reminder) {
            return res.status(404).json({ message: "Reminder not found" });
        }

        emitOpdEvent("opd:reminder", {
            type: "updated",
            reminder: reminder.toObject()
        });

        res.status(200).json({ message: "Reminder status updated", reminder });
    } catch (error) {
        console.error("Update Reminder Status Error:", error);
        res.status(500).json({ message: "Server error updating status" });
    }
};
