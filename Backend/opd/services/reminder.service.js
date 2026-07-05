import OpdConsultation from "../models/OpdConsultation.js";
import OpdReminder from "../models/OpdReminder.js";
import { emitOpdEvent } from "../socket.js";

export const scanAndSendReminders = async () => {
    try {
        console.log("⏰ Running OPD Follow-up Reminder Scan...");
        
        // Find consultations with a follow-up date set
        const consultations = await OpdConsultation.find({ 
            followUpDate: { $ne: null } 
        }).populate("patientId");

        let remindersCreated = 0;
        const now = new Date();

        for (const cons of consultations) {
            if (!cons.patientId || !cons.followUpDate) continue;

            const followUpDate = new Date(cons.followUpDate);
            
            // Calculate difference in time
            const diffTime = followUpDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If follow-up is within the next 3 days and not in the past
            if (diffDays >= 0 && diffDays <= 3) {
                // Check if we already sent a reminder for this patient and follow-up date
                // We truncate the date to avoid duplicate scans
                const startOfDay = new Date(followUpDate.setHours(0,0,0,0));
                const endOfDay = new Date(followUpDate.setHours(23,59,59,999));

                const existingReminder = await OpdReminder.findOne({
                    patientId: cons.patientId._id,
                    followUpDate: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                });

                if (!existingReminder) {
                    const message = `Hello ${cons.patientId.name}, this is a friendly reminder of your upcoming follow-up consultation with ${cons.doctorName} scheduled for ${cons.followUpDate.toLocaleDateString()}. Please contact Heka OPD if you need to reschedule.`;
                    
                    const reminder = await OpdReminder.create({
                        patientId: cons.patientId._id,
                        followUpDate: cons.followUpDate,
                        message,
                        status: "Sent"
                    });

                    emitOpdEvent("opd:reminder", { type: "created", reminder: { ...reminder.toObject(), patientId: cons.patientId } });

                    console.log(`✉️ Follow-up reminder logged/sent to ${cons.patientId.name} for date ${cons.followUpDate.toLocaleDateString()}`);
                    remindersCreated++;
                }
            }
        }

        console.log(`⏰ OPD Reminder Scan complete. Sent ${remindersCreated} new reminders.`);
        return remindersCreated;
    } catch (error) {
        console.error("❌ Error running reminder scan service:", error);
        throw error;
    }
};

// Start background scanner interval (runs every 1 hour)
export const startReminderScheduler = () => {
    // Run once at startup after a small delay
    setTimeout(() => {
        scanAndSendReminders().catch(err => {});
    }, 10000);

    // Repeat every 1 hour
    setInterval(() => {
        scanAndSendReminders().catch(err => {});
    }, 1000 * 60 * 60);
};
