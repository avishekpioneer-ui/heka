import OpdConsultation from "../models/OpdConsultation.js";
import OpdReminder from "../models/OpdReminder.js";
import { emitOpdEvent } from "../socket.js";

export const scanAndSendReminders = async () => {
    try {
        console.log("⏰ Running OPD Follow-up Reminder Scan / Consults Sync...");
        
        // Find consultations with a follow-up date set
        const consultations = await OpdConsultation.find({ 
            followUpDate: { $ne: null } 
        }).populate("patientId");

        let remindersCreated = 0;
        const now = new Date();

        for (const cons of consultations) {
            if (!cons.patientId || !cons.followUpDate) continue;

            const followUpDate = new Date(cons.followUpDate);
            if (isNaN(followUpDate.getTime())) continue;
            
            // Truncate to check if reminder already created for this patient and date
            const startOfDay = new Date(followUpDate);
            startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(followUpDate);
            endOfDay.setHours(23,59,59,999);

            const existingReminder = await OpdReminder.findOne({
                patientId: cons.patientId._id,
                followUpDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (!existingReminder) {
                const formattedDate = followUpDate.toLocaleDateString();
                const patientName = cons.patientId.name || "Patient";
                const doctorName = cons.doctorName || "Doctor";
                const diagInfo = cons.diagnosis ? ` for ${cons.diagnosis}` : "";
                const message = `Clinical follow-up advisory: Consult with Dr. ${doctorName}${diagInfo}. Advised revisit on ${formattedDate}.`;
                
                const diffTime = followUpDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const status = (diffDays >= 0 && diffDays <= 3) ? "Sent" : (diffDays < 0 ? "Completed" : "Scheduled");

                const reminder = await OpdReminder.create({
                    patientId: cons.patientId._id,
                    followUpDate: followUpDate,
                    message,
                    status
                });

                emitOpdEvent("opd:reminder", { 
                    type: "created", 
                    reminder: { ...reminder.toObject(), patientId: cons.patientId } 
                });

                console.log(`✉️ Follow-up reminder synced from clinical consult for ${patientName} on date ${formattedDate}`);
                remindersCreated++;
            }
        }

        console.log(`⏰ OPD Reminder Scan complete. Synced/sent ${remindersCreated} new reminders.`);
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
        scanAndSendReminders().catch(err => {
            console.error("Scheduler initial scan error:", err);
        });
    }, 10000);

    // Repeat every 1 hour
    setInterval(() => {
        scanAndSendReminders().catch(err => {
            console.error("Scheduler periodic scan error:", err);
        });
    }, 1000 * 60 * 60);
};
