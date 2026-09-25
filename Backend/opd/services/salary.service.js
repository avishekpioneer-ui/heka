import OpdUser from "../models/OpdUser.js";
import OpdSalary from "../models/OpdSalary.js";
import { getPreviousMonth } from "../controllers/opdAccount.controller.js";

// Auto-generates salary records for all eligible staff for a given month (defaults to current month)
export const autoGenerateMonthlySalaries = async (targetMonth) => {
    try {
        const month = targetMonth || new Date().toISOString().slice(0, 7);
        const staffList = await OpdUser.find({});

        let generatedCount = 0;
        for (const staff of staffList) {
            const dojDate = staff.doj || staff.createdAt || new Date();
            const dojMonth = new Date(dojDate).toISOString().slice(0, 7);

            // Skip if staff joined in a future month
            if (month < dojMonth) {
                continue;
            }

            const existing = await OpdSalary.findOne({ staffId: staff._id, month });
            if (!existing) {
                const prevMonthStr = getPreviousMonth(month);
                const prevSalary = await OpdSalary.findOne({ staffId: staff._id, month: prevMonthStr });
                const carriedOverBalance = prevSalary ? prevSalary.remainingBalance : 0;
                const baseSalary = staff.baseSalary || 0;
                const netPayable = baseSalary + carriedOverBalance;

                await OpdSalary.create({
                    staffId: staff._id,
                    month,
                    baseSalary,
                    isCustomSalary: false,
                    carriedOverBalance,
                    netPayable,
                    payments: [],
                    totalPaid: 0,
                    remainingBalance: netPayable,
                    status: "Unpaid"
                });
                generatedCount++;
            }
        }
        if (generatedCount > 0) {
            console.log(`⚡ [SalaryScheduler] Auto-generated ${generatedCount} salary record(s) for ${month} from staff base salaries.`);
        }
        return generatedCount;
    } catch (error) {
        console.error("❌ [SalaryScheduler] Error auto-generating salaries:", error);
    }
};

// Start background salary scheduler (runs once on startup, and periodically checks for 1st of month)
export const startSalaryScheduler = () => {
    // 1. Initial run on startup after 5 seconds
    setTimeout(() => {
        autoGenerateMonthlySalaries().catch(err => {
            console.error("❌ [SalaryScheduler] Initial run failed:", err);
        });
    }, 5000);

    // 2. Periodic interval every 1 hour to detect month turnover (1st day of month)
    setInterval(() => {
        autoGenerateMonthlySalaries().catch(err => {
            console.error("❌ [SalaryScheduler] Periodic run failed:", err);
        });
    }, 60 * 60 * 1000);
};
