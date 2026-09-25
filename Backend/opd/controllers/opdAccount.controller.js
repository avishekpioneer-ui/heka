import mongoose from "mongoose";
import OpdSalary from "../models/OpdSalary.js";
import OpdUser from "../models/OpdUser.js";
import OpdBilling from "../models/OpdBilling.js";

// Helper: Get Previous Month String ("YYYY-MM")
export const getPreviousMonth = (monthStr) => {
    const [year, month] = monthStr.split("-").map(Number);
    if (month === 1) {
        return `${year - 1}-12`;
    }
    const prevMonth = month - 1;
    return `${year}-${prevMonth < 10 ? "0" + prevMonth : prevMonth}`;
};

// Helper: Get Next Month String ("YYYY-MM")
export const getNextMonth = (monthStr) => {
    const [year, month] = monthStr.split("-").map(Number);
    if (month === 12) {
        return `${year + 1}-01`;
    }
    const nextM = month + 1;
    return `${year}-${nextM < 10 ? "0" + nextM : nextM}`;
};

// Helper: Get Staff's DOJ month string ("YYYY-MM")
export const getStaffDojMonth = (staff) => {
    const date = staff.doj || staff.createdAt || new Date();
    return new Date(date).toISOString().slice(0, 7);
};

// Helper: Get effective base salary for a month (defaults to staff.baseSalary)
export const getEffectiveBaseSalary = (staff) => {
    return staff.baseSalary || 0;
};

// Helper: Cascade forward any carry-overs to subsequent existing salary records
export const cascadeForwardCarryOver = async (staffId, startMonth) => {
    let currentMonth = startMonth;
    const staffDoc = await OpdUser.findById(staffId);
    const defaultBase = staffDoc?.baseSalary || 0;

    // Iterate through up to 24 forward months if records exist
    for (let i = 0; i < 24; i++) {
        const nextMonth = getNextMonth(currentMonth);
        const nextSalary = await OpdSalary.findOne({ staffId, month: nextMonth });
        if (!nextSalary) {
            break; // No subsequent record to cascade into
        }

        // Get currentMonth salary to calculate its remaining balance
        const currSalary = await OpdSalary.findOne({ staffId, month: currentMonth });
        const carryOver = currSalary ? currSalary.remainingBalance : 0;

        // If next month's salary was NOT explicitly custom-edited by admin,
        // it retains staff member's standard base salary (e.g. 10000 in April after 12000 bonus in March)
        if (!nextSalary.isCustomSalary) {
            nextSalary.baseSalary = defaultBase;
        }

        nextSalary.carriedOverBalance = carryOver;
        nextSalary.netPayable = (nextSalary.baseSalary || 0) + carryOver;
        nextSalary.totalPaid = (nextSalary.payments || []).reduce((acc, p) => acc + p.amount, 0);
        nextSalary.remainingBalance = nextSalary.netPayable - nextSalary.totalPaid;

        if (nextSalary.totalPaid === 0) {
            nextSalary.status = "Unpaid";
        } else if (nextSalary.totalPaid < nextSalary.netPayable) {
            nextSalary.status = "Partially Paid";
        } else if (nextSalary.totalPaid === nextSalary.netPayable) {
            nextSalary.status = "Paid";
        } else {
            nextSalary.status = "Overpaid";
        }

        await nextSalary.save();
        currentMonth = nextMonth;
    }
};

// ==========================================
// SALARY & PART-BY-PART PAYMENTS
// ==========================================

// GET /api/opd/accounts/salaries?month=YYYY-MM
export const getMonthlySalaries = async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);

        // Fetch all active staff
        const staffList = await OpdUser.find({}).populate("role", "name").sort({ name: 1 });

        const results = [];
        let totalMonthlyPayable = 0;
        let totalMonthlyPaid = 0;
        let totalMonthlyPending = 0;
        let unGeneratedCount = 0;

        for (const staff of staffList) {
            const dojMonth = getStaffDojMonth(staff);

            // Rule 1: Salary starts AFTER/FROM user's DOJ month
            // If the selected month is before their joining month, skip or mark not eligible
            if (month < dojMonth) {
                continue; // Do not include staff who joined in a future month
            }

            // Check if salary record already exists in database
            const currentMonthStr = new Date().toISOString().slice(0, 7);
            let existingSalary = await OpdSalary.findOne({ staffId: staff._id, month });

            // If it's the current month or past month (>= DOJ), auto-generate on the 1st of month from base salary
            if (!existingSalary && month <= currentMonthStr) {
                const prevMonthStr = getPreviousMonth(month);
                const prevSalary = await OpdSalary.findOne({ staffId: staff._id, month: prevMonthStr });
                const carriedOverBalance = prevSalary ? prevSalary.remainingBalance : 0;
                const baseSalary = staff.baseSalary || 0;
                const netPayable = baseSalary + carriedOverBalance;

                existingSalary = await OpdSalary.create({
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
            }

            if (existingSalary) {
                // If not custom-edited by admin, ensure it reflects staff member's standard base salary
                // (so a one-time bonus like 12000 in March does NOT contaminate April, which stays 10000)
                if (!existingSalary.isCustomSalary) {
                    const defaultBase = staff.baseSalary || 0;
                    if (existingSalary.baseSalary !== defaultBase) {
                        existingSalary.baseSalary = defaultBase;
                        existingSalary.netPayable = defaultBase + (existingSalary.carriedOverBalance || 0);
                    }
                }

                // Ensure payments & balances are synchronized
                existingSalary.totalPaid = (existingSalary.payments || []).reduce((acc, p) => acc + p.amount, 0);
                existingSalary.remainingBalance = existingSalary.netPayable - existingSalary.totalPaid;

                if (existingSalary.totalPaid === 0) {
                    existingSalary.status = "Unpaid";
                } else if (existingSalary.totalPaid < existingSalary.netPayable) {
                    existingSalary.status = "Partially Paid";
                } else if (existingSalary.totalPaid === existingSalary.netPayable) {
                    existingSalary.status = "Paid";
                } else {
                    existingSalary.status = "Overpaid";
                }
                await existingSalary.save();

                totalMonthlyPayable += existingSalary.netPayable;
                totalMonthlyPaid += existingSalary.totalPaid;
                totalMonthlyPending += existingSalary.remainingBalance;

                results.push({
                    staff: {
                        _id: staff._id,
                        name: staff.name,
                        email: staff.email,
                        roleName: staff.role?.name || (staff.isDoctor ? "Doctor" : "Staff"),
                        isDoctor: staff.isDoctor,
                        baseSalary: existingSalary.baseSalary,
                        doj: staff.doj || staff.createdAt
                    },
                    salary: existingSalary,
                    payments: existingSalary.payments || [],
                    isGenerated: true
                });
            } else {
                // Future month: compute carry-over preview so admin can see what will be generated
                const prevMonthStr = getPreviousMonth(month);
                const prevSalary = await OpdSalary.findOne({ staffId: staff._id, month: prevMonthStr });
                const carriedOverBalance = prevSalary ? prevSalary.remainingBalance : 0;
                const baseSalary = staff.baseSalary || 0;
                const netPayable = baseSalary + carriedOverBalance;

                unGeneratedCount++;

                results.push({
                    staff: {
                        _id: staff._id,
                        name: staff.name,
                        email: staff.email,
                        roleName: staff.role?.name || (staff.isDoctor ? "Doctor" : "Staff"),
                        isDoctor: staff.isDoctor,
                        baseSalary,
                        doj: staff.doj || staff.createdAt
                    },
                    salary: {
                        staffId: staff._id,
                        month,
                        baseSalary,
                        isCustomSalary: false,
                        carriedOverBalance,
                        netPayable,
                        payments: [],
                        totalPaid: 0,
                        remainingBalance: netPayable,
                        status: "Not Generated"
                    },
                    payments: [],
                    isGenerated: false
                });
            }
        }

        res.status(200).json({
            month,
            totals: {
                totalPayable: totalMonthlyPayable,
                totalPaid: totalMonthlyPaid,
                totalPending: totalMonthlyPending
            },
            unGeneratedCount,
            allGenerated: unGeneratedCount === 0 && results.length > 0,
            salaries: results
        });
    } catch (error) {
        console.error("Get Monthly Salaries Error:", error);
        res.status(500).json({ message: "Server error fetching monthly salaries", error: error.message });
    }
};

// POST /api/opd/accounts/salaries/generate
// Rule 2: Generate salary on Admin click
export const generateMonthlySalaries = async (req, res) => {
    try {
        const { month, staffId } = req.body;

        if (!month) {
            return res.status(400).json({ message: "Month (YYYY-MM) is required to generate salaries." });
        }

        let staffQuery = {};
        if (staffId) {
            staffQuery._id = staffId;
        }

        const staffList = await OpdUser.find(staffQuery);
        const generatedList = [];

        for (const staff of staffList) {
            const dojMonth = getStaffDojMonth(staff);
            // Staff cannot have salary generated before their DOJ month
            if (month < dojMonth) {
                continue;
            }

            // Check if already generated
            let salary = await OpdSalary.findOne({ staffId: staff._id, month });

            if (!salary) {
                // Get previous month carryover balance
                const prevMonthStr = getPreviousMonth(month);
                const prevSalary = await OpdSalary.findOne({ staffId: staff._id, month: prevMonthStr });
                const carriedOverBalance = prevSalary ? prevSalary.remainingBalance : 0;
                
                const baseSalary = staff.baseSalary || 0;
                const netPayable = baseSalary + carriedOverBalance;

                salary = await OpdSalary.create({
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

                // Also cascade to any forward months if they already existed
                await cascadeForwardCarryOver(staff._id, month);
                generatedList.push(salary);
            }
        }

        res.status(201).json({
            message: `Successfully generated ${generatedList.length} staff salary record(s) for ${month}.`,
            count: generatedList.length,
            month
        });
    } catch (error) {
        console.error("Generate Monthly Salaries Error:", error);
        res.status(500).json({ message: "Server error generating monthly salaries", error: error.message });
    }
};

// PUT /api/opd/accounts/salaries/:salaryId/amount
// Rule 3: Admin can change salary amount for ANY specific month
export const updateMonthSalaryAmount = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const { amount, updatePermanentBase } = req.body;

        if (amount === undefined || Number(amount) < 0) {
            return res.status(400).json({ message: "Valid non-negative salary amount is required." });
        }

        const salary = await OpdSalary.findById(salaryId);
        if (!salary) {
            return res.status(404).json({ message: "Salary record not found for this month." });
        }

        const newBaseSalary = parseFloat(amount);
        salary.baseSalary = newBaseSalary;
        salary.isCustomSalary = true;
        salary.netPayable = newBaseSalary + (salary.carriedOverBalance || 0);
        salary.remainingBalance = salary.netPayable - (salary.totalPaid || 0);

        if (salary.totalPaid === 0) {
            salary.status = "Unpaid";
        } else if (salary.totalPaid < salary.netPayable) {
            salary.status = "Partially Paid";
        } else if (salary.totalPaid === salary.netPayable) {
            salary.status = "Paid";
        } else {
            salary.status = "Overpaid";
        }

        await salary.save();

        // If admin requested to also update permanent base salary in staff profile
        if (updatePermanentBase) {
            await OpdUser.findByIdAndUpdate(salary.staffId, { baseSalary: newBaseSalary });
        }

        // Cascade carry-over to future months
        await cascadeForwardCarryOver(salary.staffId, salary.month);

        res.status(200).json({
            message: `Salary for ${salary.month} updated to ₹${newBaseSalary} successfully`,
            salary
        });
    } catch (error) {
        console.error("Update Month Salary Amount Error:", error);
        res.status(500).json({ message: "Server error updating month salary amount", error: error.message });
    }
};

// POST /api/opd/accounts/salaries/payment
// Adds an installment directly into the salary's payments array
export const addSalaryPayment = async (req, res) => {
    try {
        const { staffId, month, amount, paymentDate, paymentMode, transactionId, notes } = req.body;

        if (!staffId || !month || !amount || Number(amount) <= 0) {
            return res.status(400).json({ message: "Staff ID, valid month, and positive payment amount are required." });
        }

        const staff = await OpdUser.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        const dojMonth = getStaffDojMonth(staff);
        if (month < dojMonth) {
            return res.status(400).json({ message: `Cannot add payment for ${month}: staff joined in ${dojMonth}.` });
        }

        // Find or create salary record for this month
        let salary = await OpdSalary.findOne({ staffId, month });
        if (!salary) {
            // Auto-generate if adding payment directly
            const prevMonthStr = getPreviousMonth(month);
            const prevSalary = await OpdSalary.findOne({ staffId, month: prevMonthStr });
            const carriedOverBalance = prevSalary ? prevSalary.remainingBalance : 0;
            const baseSalary = staff.baseSalary || 0;
            const netPayable = baseSalary + carriedOverBalance;

            salary = new OpdSalary({
                staffId,
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
        }

        // Next part number
        const partNumber = (salary.payments?.length || 0) + 1;

        const newPayment = {
            partNumber,
            amount: parseFloat(amount),
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMode: paymentMode || "Cash",
            transactionId: transactionId || "",
            notes: notes || `Part ${partNumber} Salary Payment`,
            paidBy: req.user?.id || null
        };

        salary.payments.push(newPayment);
        salary.totalPaid = salary.payments.reduce((acc, p) => acc + p.amount, 0);
        salary.remainingBalance = salary.netPayable - salary.totalPaid;

        if (salary.totalPaid === 0) {
            salary.status = "Unpaid";
        } else if (salary.totalPaid < salary.netPayable) {
            salary.status = "Partially Paid";
        } else if (salary.totalPaid === salary.netPayable) {
            salary.status = "Paid";
        } else {
            salary.status = "Overpaid";
        }

        await salary.save();

        // Cascade forward to future months if they exist
        await cascadeForwardCarryOver(staffId, month);

        res.status(201).json({
            message: `Part ${partNumber} payment of ₹${amount} recorded successfully`,
            payment: salary.payments[salary.payments.length - 1],
            salary
        });
    } catch (error) {
        console.error("Add Salary Payment Error:", error);
        res.status(500).json({ message: "Server error recording salary payment", error: error.message });
    }
};

// DELETE /api/opd/accounts/salaries/payment/:paymentId
export const deleteSalaryPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const salary = await OpdSalary.findOne({ "payments._id": paymentId });
        if (!salary) {
            return res.status(404).json({ message: "Payment installment not found" });
        }

        salary.payments.pull({ _id: paymentId });
        salary.totalPaid = salary.payments.reduce((acc, p) => acc + p.amount, 0);
        salary.remainingBalance = salary.netPayable - salary.totalPaid;

        if (salary.totalPaid === 0) {
            salary.status = "Unpaid";
        } else if (salary.totalPaid < salary.netPayable) {
            salary.status = "Partially Paid";
        } else if (salary.totalPaid === salary.netPayable) {
            salary.status = "Paid";
        } else {
            salary.status = "Overpaid";
        }

        await salary.save();

        // Cascade forward to future months
        await cascadeForwardCarryOver(salary.staffId, salary.month);

        res.status(200).json({
            message: "Payment installment removed successfully",
            salary
        });
    } catch (error) {
        console.error("Delete Salary Payment Error:", error);
        res.status(500).json({ message: "Server error deleting salary payment", error: error.message });
    }
};

// PUT /api/opd/accounts/staff/:staffId/base-salary
export const updateStaffBaseSalary = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { baseSalary, month } = req.body;

        if (baseSalary === undefined || Number(baseSalary) < 0) {
            return res.status(400).json({ message: "Valid positive base salary amount is required" });
        }

        const staff = await OpdUser.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        staff.baseSalary = parseFloat(baseSalary);
        await staff.save();

        let updatedSalary = null;
        if (month) {
            const salary = await OpdSalary.findOne({ staffId, month });
            if (salary) {
                salary.baseSalary = parseFloat(baseSalary);
                salary.netPayable = salary.baseSalary + (salary.carriedOverBalance || 0);
                salary.remainingBalance = salary.netPayable - (salary.totalPaid || 0);
                await salary.save();
                updatedSalary = salary;
                await cascadeForwardCarryOver(staffId, month);
            }
        }

        res.status(200).json({
            message: "Staff default base salary updated successfully",
            baseSalary: staff.baseSalary,
            salary: updatedSalary
        });
    } catch (error) {
        console.error("Update Staff Base Salary Error:", error);
        res.status(500).json({ message: "Server error updating base salary", error: error.message });
    }
};

// PUT /api/opd/accounts/staff/:staffId/profile
// Allows updating staff DOJ and/or permanent base salary anytime
export const updateStaffProfile = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { baseSalary, doj, month } = req.body;

        const staff = await OpdUser.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        if (baseSalary !== undefined && Number(baseSalary) >= 0) {
            staff.baseSalary = parseFloat(baseSalary);
        }
        if (doj) {
            staff.doj = new Date(doj);
        }
        await staff.save();

        let updatedSalary = null;
        if (month) {
            const salary = await OpdSalary.findOne({ staffId, month });
            if (salary && baseSalary !== undefined) {
                salary.baseSalary = parseFloat(baseSalary);
                salary.netPayable = salary.baseSalary + (salary.carriedOverBalance || 0);
                salary.remainingBalance = salary.netPayable - (salary.totalPaid || 0);
                await salary.save();
                updatedSalary = salary;
                await cascadeForwardCarryOver(staffId, month);
            }
        }

        res.status(200).json({
            message: "Staff profile (DOJ and base salary) updated successfully",
            staff,
            salary: updatedSalary
        });
    } catch (error) {
        console.error("Update Staff Profile Error:", error);
        res.status(500).json({ message: "Server error updating staff profile", error: error.message });
    }
};

// ==========================================
// ACCOUNTS & PAYROLL SUMMARY
// ==========================================

// GET /api/opd/accounts/summary?month=YYYY-MM
export const getAccountsSummary = async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        const [year, m] = month.split("-").map(Number);
        const startDate = new Date(year, m - 1, 1);
        const endDate = new Date(year, m, 0, 23, 59, 59, 999);

        // 1. OPD Revenue: All paid bills in this month
        const bills = await OpdBilling.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $in: ["Paid", "Settled"] }
        });

        const totalRevenue = bills.reduce((acc, bill) => acc + (bill.grandTotal || bill.totalAmount || 0), 0);

        // 2. Total Salaries Paid this month across all staff
        const salaries = await OpdSalary.find({ month });
        const totalSalariesPaid = salaries.reduce((acc, s) => acc + (s.totalPaid || 0), 0);
        const totalInstallmentsCount = salaries.reduce((acc, s) => acc + (s.payments?.length || 0), 0);

        // 3. Net Cash Flow
        const netProfit = totalRevenue - totalSalariesPaid;

        res.status(200).json({
            month,
            revenue: {
                totalRevenue,
                invoicesCount: bills.length
            },
            payroll: {
                totalSalariesPaid,
                paymentsCount: totalInstallmentsCount
            },
            netSummary: {
                totalInflow: totalRevenue,
                totalOutflow: totalSalariesPaid,
                netProfit
            }
        });
    } catch (error) {
        console.error("Get Accounts Summary Error:", error);
        res.status(500).json({ message: "Server error getting accounts summary", error: error.message });
    }
};
