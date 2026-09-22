import mongoose from "mongoose";
import OpdBilling from "../models/OpdBilling.js";
import OpdPatient from "../models/OpdPatient.js";
import OpdMedicine from "../models/OpdMedicine.js";
import OpdTestOrder from "../models/OpdTestOrder.js";
import OpdReminder from "../models/OpdReminder.js";
import { emitOpdEvent } from "../socket.js";

const enrichBillsWithReminders = async (bills) => {
    if (!Array.isArray(bills) || bills.length === 0) return [];
    const billIds = bills.map(b => b._id);
    const reminders = await OpdReminder.find({ billId: { $in: billIds } });
    const reminderMap = {};
    reminders.forEach(r => {
        if (r.billId) reminderMap[r.billId.toString()] = r;
    });

    const enriched = await Promise.all(bills.map(async (bill) => {
        const billObj = typeof bill.toObject === 'function' ? bill.toObject() : { ...bill };
        let rem = reminderMap[billObj._id.toString()];
        if (!rem && billObj.patientId) {
            const pId = billObj.patientId._id || billObj.patientId;
            if (billObj.appointmentId) {
                const apptId = billObj.appointmentId._id || billObj.appointmentId;
                rem = await OpdReminder.findOne({ patientId: pId, appointmentId: apptId });
            }
            if (!rem) {
                rem = await OpdReminder.findOne({ patientId: pId }).sort({ followUpDate: -1, createdAt: -1 });
            }
        }
        billObj.followUpDate = rem?.followUpDate || null;
        billObj.reminderId = rem?._id || null;
        return billObj;
    }));
    return enriched;
};

const sanitizeMedicines = (meds) => {
    if (!Array.isArray(meds)) return [];
    return meds.map(m => {
        const rawId = m.medicineId || m._id || m.id;
        const validId = (rawId && mongoose.Types.ObjectId.isValid(rawId)) ? rawId : undefined;
        const medObj = {
            name: m.name || "Medicine",
            price: parseFloat(m.price || 0),
            quantity: parseInt(m.quantity) || 1
        };
        if (validId) {
            medObj.medicineId = validId;
        }
        return medObj;
    });
};

const sanitizeTests = (tests) => {
    if (!Array.isArray(tests)) return [];
    return tests.map(t => {
        const rawId = t.testId || t._id || t.id;
        const validId = (rawId && mongoose.Types.ObjectId.isValid(rawId)) ? rawId : undefined;
        const testObj = {
            name: t.name || "Diagnostic Test",
            price: parseFloat(t.price || 0),
            scheduledDate: t.scheduledDate || null,
            notes: t.notes || ""
        };
        if (validId) {
            testObj.testId = validId;
        }
        return testObj;
    });
};

export const createBill = async (req, res) => {
    try {
        let { patientId, appointmentId, consultationFee, tests, medicines, items, billingType, status, paymentStatus, followUpDate } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        const resolvedStatus = status || paymentStatus || "Pending";

        // If items array is provided (e.g. from Mobile app), parse it into tests and medicines
        if (Array.isArray(items) && items.length > 0) {
            tests = [];
            medicines = [];
            for (const it of items) {
                if (it.itemType === 'Consultation') {
                    consultationFee = it.price;
                } else if (it.itemType === 'Test') {
                    tests.push({
                        testId: it.testId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0)
                    });
                } else if (it.itemType === 'Medicine') {
                    medicines.push({
                        medicineId: it.medicineId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        quantity: parseInt(it.quantity) || 1
                    });
                }
            }
        }

        const cleanMeds = sanitizeMedicines(medicines);
        const cleanTests = sanitizeTests(tests);

        // Validate and reserve pharmacy stock before creating the bill
        if (cleanMeds && cleanMeds.length > 0) {
            const validMedIds = cleanMeds.map((m) => m.medicineId).filter(Boolean);
            if (validMedIds.length > 0) {
                const stockDocs = await OpdMedicine.find({ _id: { $in: validMedIds } });
                for (const item of cleanMeds) {
                    if (!item.medicineId) continue;
                    const stockDoc = stockDocs.find((m) => m._id.toString() === item.medicineId.toString());
                    if (stockDoc && stockDoc.stock < (item.quantity || 1)) {
                        return res.status(400).json({
                            message: `Insufficient stock for ${item.name}. Available: ${stockDoc.stock}`
                        });
                    }
                }
                await Promise.all(
                    cleanMeds
                        .filter((item) => item.medicineId)
                        .map((item) =>
                            OpdMedicine.updateOne({ _id: item.medicineId }, { $inc: { stock: -(item.quantity || 1) } })
                        )
                );
            }
        }

        // Calculate totalAmount accurately (unit price * quantity for medicines)
        let total = 0;
        if (consultationFee) total += parseFloat(consultationFee);
        if (cleanTests && cleanTests.length > 0) {
            total += cleanTests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
        }
        if (cleanMeds && cleanMeds.length > 0) {
            total += cleanMeds.reduce((sum, m) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);
        }

        // If totalAmount was provided in request and calculated total is 0 (fallback)
        if (total === 0 && req.body.totalAmount) {
            total = parseFloat(req.body.totalAmount);
        }

        const bill = await OpdBilling.create({
            patientId,
            appointmentId: appointmentId || null,
            consultationFee: consultationFee || 0,
            tests: cleanTests,
            medicines: cleanMeds,
            totalAmount: total,
            status: resolvedStatus,
            billingType: billingType || "Combined"
        });

        // Automatically schedule test orders for diagnostic tests in this invoice
        if (cleanTests && cleanTests.length > 0) {
            for (const t of cleanTests) {
                if (t.testId) {
                    const testOrder = await OpdTestOrder.create({
                        patientId,
                        testId: t.testId,
                        testName: t.name,
                        price: t.price,
                        scheduledDate: t.scheduledDate || new Date(),
                        notes: t.notes || "",
                        billId: bill._id,
                        status: "Ordered"
                    });
                    emitOpdEvent("opd:testorder", { type: "created", order: testOrder });
                }
            }
        }

        // Automatically schedule follow-up OpdReminder if followUpDate is set
        let reminderDoc = null;
        if (followUpDate) {
            const fDate = new Date(followUpDate);
            if (!isNaN(fDate.getTime())) {
                const pDoc = await OpdPatient.findById(patientId);
                const message = `Clinical follow-up advisory: Advised revisit on ${fDate.toLocaleDateString()}.`;

                reminderDoc = await OpdReminder.create({
                    patientId,
                    followUpDate: fDate,
                    message,
                    billId: bill._id,
                    appointmentId: appointmentId || undefined,
                    status: "Scheduled"
                });

                emitOpdEvent("opd:reminder", {
                    type: "created",
                    reminder: { ...reminderDoc.toObject(), patientId: pDoc || patientId }
                });
            }
        }

        const populatedBill = await OpdBilling.findById(bill._id)
            .populate("patientId")
            .populate("appointmentId");
        const billResult = populatedBill ? populatedBill.toObject() : bill.toObject();
        billResult.followUpDate = reminderDoc?.followUpDate || null;
        billResult.reminderId = reminderDoc?._id || null;

        emitOpdEvent("opd:bill", { type: "created", bill: billResult });

        res.status(201).json({ message: "Bill generated and diagnostic tests scheduled successfully", bill: billResult });
    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBills = async (req, res) => {
    try {
        const bills = await OpdBilling.find({})
            .populate("patientId")
            .populate("appointmentId")
            .sort({ createdAt: -1 });
        const enrichedBills = await enrichBillsWithReminders(bills);
        res.status(200).json(enrichedBills);
    } catch (error) {
        console.error("Get Bills Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await OpdBilling.findById(id)
            .populate("patientId")
            .populate("appointmentId");
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }
        const [enrichedBill] = await enrichBillsWithReminders([bill]);
        res.status(200).json(enrichedBill);
    } catch (error) {
        console.error("Get Bill By ID Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
export const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        let { patientId, consultationFee, tests, medicines, items, status, paymentStatus, billingType, followUpDate } = req.body;

        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        // If items array is provided (e.g. from Mobile app), parse it into tests and medicines
        if (Array.isArray(items) && items.length > 0) {
            tests = [];
            medicines = [];
            for (const it of items) {
                if (it.itemType === 'Consultation') {
                    consultationFee = it.price;
                } else if (it.itemType === 'Test') {
                    tests.push({
                        testId: it.testId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0)
                    });
                } else if (it.itemType === 'Medicine') {
                    medicines.push({
                        medicineId: it.medicineId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        quantity: parseInt(it.quantity) || 1
                    });
                }
            }
        }

        // Handle medicine stock adjustment if medicines changed
        if (medicines !== undefined) {
            const cleanMeds = sanitizeMedicines(medicines);

            // First restore previous medicine stock
            if (bill.medicines && bill.medicines.length > 0) {
                for (const oldMed of bill.medicines) {
                    if (oldMed.medicineId) {
                        await OpdMedicine.findByIdAndUpdate(oldMed.medicineId, {
                            $inc: { stock: oldMed.quantity || 1 }
                        });
                    }
                }
            }

            // Next validate and deduct new medicine stock
            const validMedIds = cleanMeds.map((m) => m.medicineId).filter(Boolean);
            if (validMedIds.length > 0) {
                const stockDocs = await OpdMedicine.find({ _id: { $in: validMedIds } });
                for (const item of cleanMeds) {
                    if (!item.medicineId) continue;
                    const stockDoc = stockDocs.find((m) => m._id.toString() === item.medicineId.toString());
                    if (stockDoc && stockDoc.stock < (item.quantity || 1)) {
                        // Re-reserve original quantities if check fails
                        if (bill.medicines && bill.medicines.length > 0) {
                            for (const oldMed of bill.medicines) {
                                if (oldMed.medicineId) {
                                    await OpdMedicine.findByIdAndUpdate(oldMed.medicineId, {
                                        $inc: { stock: -(oldMed.quantity || 1) }
                                    });
                                }
                            }
                        }
                        return res.status(400).json({
                            message: `Insufficient stock for ${item.name}. Available: ${stockDoc.stock}`
                        });
                    }
                }

                await Promise.all(
                    cleanMeds
                        .filter((item) => item.medicineId)
                        .map((item) =>
                            OpdMedicine.updateOne({ _id: item.medicineId }, { $inc: { stock: -(item.quantity || 1) } })
                        )
                );
            }

            bill.medicines = cleanMeds;
        }

        if (patientId !== undefined) bill.patientId = patientId;
        if (consultationFee !== undefined) bill.consultationFee = parseFloat(consultationFee || 0);
        if (tests !== undefined) bill.tests = sanitizeTests(tests);
        if (status !== undefined || paymentStatus !== undefined) bill.status = status || paymentStatus;
        if (billingType !== undefined) bill.billingType = billingType;

        // Recalculate totalAmount accurately
        let total = 0;
        total += parseFloat(bill.consultationFee || 0);
        if (bill.tests && bill.tests.length > 0) {
            total += bill.tests.reduce((sum, t) => sum + parseFloat(t.price || 0), 0);
        }
        if (bill.medicines && bill.medicines.length > 0) {
            total += bill.medicines.reduce((sum, m) => sum + ((parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1)), 0);
        }
        bill.totalAmount = total;

        await bill.save();

        // Handle OpdReminder for followUpDate if passed
        let reminderDoc = await OpdReminder.findOne({ billId: id });
        if (!reminderDoc && bill.patientId && bill.appointmentId) {
            reminderDoc = await OpdReminder.findOne({ patientId: bill.patientId, appointmentId: bill.appointmentId });
        }

        if (followUpDate !== undefined) {
            if (followUpDate) {
                const fDate = new Date(followUpDate);
                if (!isNaN(fDate.getTime())) {
                    const patientRefId = patientId || bill.patientId;
                    const pDoc = await OpdPatient.findById(patientRefId);
                    const message = `Clinical follow-up advisory: Advised revisit on ${fDate.toLocaleDateString()}.`;

                    if (reminderDoc) {
                        reminderDoc.followUpDate = fDate;
                        reminderDoc.message = message;
                        if (patientRefId) reminderDoc.patientId = patientRefId;
                        if (!reminderDoc.billId) reminderDoc.billId = bill._id;
                        await reminderDoc.save();
                        emitOpdEvent("opd:reminder", { type: "updated", reminder: reminderDoc });
                    } else {
                        reminderDoc = await OpdReminder.create({
                            patientId: patientRefId,
                            followUpDate: fDate,
                            message,
                            billId: bill._id,
                            appointmentId: bill.appointmentId || undefined,
                            status: "Scheduled"
                        });
                        emitOpdEvent("opd:reminder", {
                            type: "created",
                            reminder: { ...reminderDoc.toObject(), patientId: pDoc || patientRefId }
                        });
                    }
                }
            } else {
                // followUpDate is cleared
                if (reminderDoc) {
                    await OpdReminder.findByIdAndDelete(reminderDoc._id);
                    emitOpdEvent("opd:reminder", { type: "deleted", reminderId: reminderDoc._id });
                    reminderDoc = null;
                }
            }
        }

        const updatedBill = await OpdBilling.findById(id)
            .populate("patientId")
            .populate("appointmentId");

        const billResult = updatedBill ? updatedBill.toObject() : bill.toObject();
        billResult.followUpDate = reminderDoc?.followUpDate || null;
        billResult.reminderId = reminderDoc?._id || null;

        emitOpdEvent("opd:bill", { type: "updated", bill: billResult });

        res.status(200).json({ message: "Bill updated successfully", bill: billResult });
    } catch (error) {
        console.error("Update Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteBill = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        // Restore medicine stock if bill contained medicines
        if (bill.medicines && bill.medicines.length > 0) {
            for (const med of bill.medicines) {
                if (med.medicineId) {
                    await OpdMedicine.findByIdAndUpdate(med.medicineId, {
                        $inc: { stock: med.quantity || 1 }
                    });
                }
            }
        }

        // Clean up any test orders linked to this bill
        await OpdTestOrder.deleteMany({ billId: id });

        // Clean up any reminders linked to this bill
        await OpdReminder.deleteMany({ billId: id });

        await OpdBilling.findByIdAndDelete(id);

        emitOpdEvent("opd:bill", { type: "deleted", billId: id });

        res.status(200).json({ message: "Bill deleted successfully", billId: id });
    } catch (error) {
        console.error("Delete Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const payBill = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await OpdBilling.findByIdAndUpdate(id, { status: "Paid" }, { new: true })
            .populate("patientId")
            .populate("appointmentId");
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }
        emitOpdEvent("opd:bill", { type: "paid", bill });

        res.status(200).json({ message: "Payment processed. Bill marked as Paid.", bill });
    } catch (error) {
        console.error("Pay Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
