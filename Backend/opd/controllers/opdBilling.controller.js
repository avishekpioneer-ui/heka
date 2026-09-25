import mongoose from "mongoose";
import OpdBilling from "../models/OpdBilling.js";
import OpdPatient from "../models/OpdPatient.js";
import OpdMedicine from "../models/OpdMedicine.js";
import OpdTestOrder from "../models/OpdTestOrder.js";
import OpdReminder from "../models/OpdReminder.js";
import { emitOpdEvent } from "../socket.js";

const sanitizeMedicines = (meds) => {
    if (!Array.isArray(meds)) return [];
    return meds.map(m => {
        const rawId = m.medicineId || m._id || m.id;
        const validId = (rawId && mongoose.Types.ObjectId.isValid(rawId)) ? rawId : undefined;
        const medObj = {
            name: m.name || "Medicine",
            price: parseFloat(m.price || 0),
            quantity: parseInt(m.quantity) || 1,
            discount: Math.max(0, parseFloat(m.discount || 0)),
            discountType: m.discountType === "percentage" ? "percentage" : "fixed"
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
            discount: Math.max(0, parseFloat(t.discount || 0)),
            discountType: t.discountType === "percentage" ? "percentage" : "fixed",
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
        let {
            patientId,
            appointmentId,
            consultationFee,
            consultationDiscount,
            consultationDiscountType,
            tests,
            medicines,
            items,
            billingType,
            status,
            paymentStatus,
            followUpDate,
            followUpNote,
            discount,
            discountType,
            discountReason
        } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        const resolvedStatus = status || paymentStatus || "Pending";

        // If items array is provided (e.g. from Mobile app) and tests/medicines are not already provided, parse it
        if (Array.isArray(items) && items.length > 0 && (!Array.isArray(tests) || tests.length === 0) && (!Array.isArray(medicines) || medicines.length === 0)) {
            tests = [];
            medicines = [];
            for (const it of items) {
                if (it.itemType === 'Consultation') {
                    consultationFee = it.price;
                    consultationDiscount = it.discount || 0;
                    consultationDiscountType = it.discountType || "fixed";
                } else if (it.itemType === 'Test') {
                    tests.push({
                        testId: it.testId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        discount: parseFloat(it.discount || 0),
                        discountType: it.discountType || "fixed",
                        scheduledDate: it.scheduledDate || null,
                        notes: it.notes || ""
                    });
                } else if (it.itemType === 'Medicine') {
                    medicines.push({
                        medicineId: it.medicineId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        quantity: parseInt(it.quantity) || 1,
                        discount: parseFloat(it.discount || 0),
                        discountType: it.discountType || "fixed"
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

        // Calculate gross subtotal and line-item discounts
        let calculatedSubtotal = 0;
        let itemDiscountsTotal = 0;

        // 1. Consultation fee & discount
        const grossConsult = parseFloat(consultationFee || 0);
        calculatedSubtotal += grossConsult;
        const rawConsultDisc = Math.max(0, parseFloat(consultationDiscount || 0));
        const consultDiscType = consultationDiscountType === "percentage" ? "percentage" : "fixed";
        let consultDiscAmount = 0;
        if (consultDiscType === "percentage") {
            consultDiscAmount = (grossConsult * Math.min(100, rawConsultDisc)) / 100;
        } else {
            consultDiscAmount = Math.min(grossConsult, rawConsultDisc);
        }
        itemDiscountsTotal += consultDiscAmount;

        // 2. Diagnostic tests
        if (cleanTests && cleanTests.length > 0) {
            for (const t of cleanTests) {
                const grossTest = parseFloat(t.price || 0);
                calculatedSubtotal += grossTest;
                const tDisc = Math.max(0, parseFloat(t.discount || 0));
                let tDiscAmount = 0;
                if (t.discountType === "percentage") {
                    tDiscAmount = (grossTest * Math.min(100, tDisc)) / 100;
                } else {
                    tDiscAmount = Math.min(grossTest, tDisc);
                }
                itemDiscountsTotal += tDiscAmount;
            }
        }

        // 3. Medicines
        if (cleanMeds && cleanMeds.length > 0) {
            for (const m of cleanMeds) {
                const grossMed = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                calculatedSubtotal += grossMed;
                const mDisc = Math.max(0, parseFloat(m.discount || 0));
                let mDiscAmount = 0;
                if (m.discountType === "percentage") {
                    mDiscAmount = (grossMed * Math.min(100, mDisc)) / 100;
                } else {
                    mDiscAmount = Math.min(grossMed, mDisc);
                }
                itemDiscountsTotal += mDiscAmount;
            }
        }

        // If calculatedSubtotal is 0 and subtotal or totalAmount was provided in request (fallback)
        if (calculatedSubtotal === 0 && (req.body.subtotal || req.body.totalAmount)) {
            calculatedSubtotal = parseFloat(req.body.subtotal || req.body.totalAmount || 0);
        }

        // 4. Overall Invoice Discount
        const netAfterItemDiscounts = Math.max(0, calculatedSubtotal - itemDiscountsTotal);
        const rawOverallDiscount = Math.max(0, parseFloat(discount || 0));
        const resolvedDiscountType = discountType === "percentage" ? "percentage" : "fixed";
        let overallDiscountDeduction = 0;
        if (resolvedDiscountType === "percentage") {
            overallDiscountDeduction = (netAfterItemDiscounts * Math.min(100, rawOverallDiscount)) / 100;
        } else {
            overallDiscountDeduction = Math.min(rawOverallDiscount, netAfterItemDiscounts);
        }

        const totalDiscountDeduction = itemDiscountsTotal + overallDiscountDeduction;
        const total = Math.max(0, calculatedSubtotal - totalDiscountDeduction);

        const bill = await OpdBilling.create({
            patientId,
            appointmentId: appointmentId || null,
            consultationFee: consultationFee || 0,
            consultationDiscount: rawConsultDisc,
            consultationDiscountType: consultDiscType,
            tests: cleanTests,
            medicines: cleanMeds,
            subtotal: calculatedSubtotal,
            discount: rawOverallDiscount,
            discountType: resolvedDiscountType,
            discountReason: discountReason || "",
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

        // Handle Follow-up Date via OpdReminder model
        let createdReminder = null;
        if (followUpDate) {
            const parsedFollowUp = new Date(followUpDate);
            if (!isNaN(parsedFollowUp.getTime())) {
                const now = new Date();
                const diffDays = Math.ceil((parsedFollowUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const reminderStatus = (diffDays >= 0 && diffDays <= 3) ? "Sent" : (diffDays < 0 ? "Completed" : "Scheduled");
                const patientDoc = await OpdPatient.findById(patientId);
                const pName = patientDoc?.name || "Patient";
                const msg = followUpNote?.trim() || `Follow-up consultation advised for ${pName} on ${parsedFollowUp.toLocaleDateString()}.`;

                createdReminder = await OpdReminder.create({
                    patientId,
                    followUpDate: parsedFollowUp,
                    message: msg,
                    status: reminderStatus,
                    billId: bill._id,
                    appointmentId: appointmentId || null
                });

                emitOpdEvent("opd:reminder", {
                    type: "created",
                    reminder: { ...createdReminder.toObject(), patientId: patientDoc || patientId }
                });
            }
        }

        const populatedBill = await OpdBilling.findById(bill._id)
            .populate("patientId")
            .populate("appointmentId")
            .lean();

        const enrichedBill = {
            ...populatedBill,
            followUpDate: createdReminder?.followUpDate || null,
            reminderId: createdReminder?._id || null,
            followUpReminder: createdReminder ? createdReminder.toObject() : null
        };

        emitOpdEvent("opd:bill", { type: "created", bill: enrichedBill });

        res.status(201).json({ message: "Bill generated and diagnostic tests scheduled successfully", bill: enrichedBill });
    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getBills = async (req, res) => {
    try {
        const { all, page, limit } = req.query;

        if (all === "true") {
            const bills = await OpdBilling.find({})
                .populate("patientId")
                .populate("appointmentId")
                .sort({ createdAt: -1 })
                .lean();

            const billIds = bills.map(b => b._id);
            const reminders = await OpdReminder.find({ billId: { $in: billIds } }).lean();
            const reminderMap = {};
            for (const rem of reminders) {
                reminderMap[rem.billId.toString()] = rem;
            }

            const enrichedBills = bills.map(b => {
                const rem = reminderMap[b._id.toString()];
                const sub = (b.subtotal !== undefined && b.subtotal > 0) ? b.subtotal : ((b.totalAmount || 0) + (b.discount || 0));
                return {
                    ...b,
                    subtotal: sub,
                    discount: b.discount || 0,
                    discountType: b.discountType || "fixed",
                    discountReason: b.discountReason || "",
                    followUpDate: rem?.followUpDate || null,
                    reminderId: rem?._id || null,
                    followUpReminder: rem || null
                };
            });

            return res.status(200).json({ bills: enrichedBills, data: enrichedBills, total: enrichedBills.length, all: true, hasMore: false });
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 50);
        const skip = (pageNum - 1) * limitNum;

        const [bills, total] = await Promise.all([
            OpdBilling.find({})
                .populate("patientId")
                .populate("appointmentId")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            OpdBilling.countDocuments({})
        ]);

        const billIds = bills.map(b => b._id);
        const reminders = await OpdReminder.find({ billId: { $in: billIds } }).lean();
        const reminderMap = {};
        for (const rem of reminders) {
            reminderMap[rem.billId.toString()] = rem;
        }

        const enrichedBills = bills.map(b => {
            const rem = reminderMap[b._id.toString()];
            const sub = (b.subtotal !== undefined && b.subtotal > 0) ? b.subtotal : ((b.totalAmount || 0) + (b.discount || 0));
            return {
                ...b,
                subtotal: sub,
                discount: b.discount || 0,
                discountType: b.discountType || "fixed",
                discountReason: b.discountReason || "",
                followUpDate: rem?.followUpDate || null,
                reminderId: rem?._id || null,
                followUpReminder: rem || null
            };
        });

        const hasMore = skip + bills.length < total;

        res.status(200).json({
            bills: enrichedBills,
            data: enrichedBills,
            total,
            page: pageNum,
            limit: limitNum,
            hasMore
        });
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
            .populate("appointmentId")
            .lean();
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }
        const rem = await OpdReminder.findOne({ billId: id }).lean();
        const sub = (bill.subtotal !== undefined && bill.subtotal > 0) ? bill.subtotal : ((bill.totalAmount || 0) + (bill.discount || 0));
        res.status(200).json({
            ...bill,
            subtotal: sub,
            discount: bill.discount || 0,
            discountType: bill.discountType || "fixed",
            discountReason: bill.discountReason || "",
            followUpDate: rem?.followUpDate || null,
            reminderId: rem?._id || null,
            followUpReminder: rem || null
        });
    } catch (error) {
        console.error("Get Bill By ID Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        let {
            patientId,
            consultationFee,
            consultationDiscount,
            consultationDiscountType,
            tests,
            medicines,
            items,
            status,
            paymentStatus,
            billingType,
            followUpDate,
            followUpNote,
            discount,
            discountType,
            discountReason
        } = req.body;

        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        // If items array is provided (e.g. from Mobile app) and tests/medicines are not already provided, parse it
        if (Array.isArray(items) && items.length > 0 && (!Array.isArray(tests) || tests.length === 0) && (!Array.isArray(medicines) || medicines.length === 0)) {
            tests = [];
            medicines = [];
            for (const it of items) {
                if (it.itemType === 'Consultation') {
                    consultationFee = it.price;
                    consultationDiscount = it.discount || 0;
                    consultationDiscountType = it.discountType || "fixed";
                } else if (it.itemType === 'Test') {
                    tests.push({
                        testId: it.testId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        discount: parseFloat(it.discount || 0),
                        discountType: it.discountType || "fixed",
                        scheduledDate: it.scheduledDate || null,
                        notes: it.notes || ""
                    });
                } else if (it.itemType === 'Medicine') {
                    medicines.push({
                        medicineId: it.medicineId || it._id || it.id,
                        name: it.name,
                        price: parseFloat(it.price || 0),
                        quantity: parseInt(it.quantity) || 1,
                        discount: parseFloat(it.discount || 0),
                        discountType: it.discountType || "fixed"
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
        if (consultationDiscount !== undefined) bill.consultationDiscount = Math.max(0, parseFloat(consultationDiscount) || 0);
        if (consultationDiscountType !== undefined) bill.consultationDiscountType = consultationDiscountType === "percentage" ? "percentage" : "fixed";
        if (tests !== undefined) bill.tests = sanitizeTests(tests);
        if (status !== undefined || paymentStatus !== undefined) bill.status = status || paymentStatus;
        if (billingType !== undefined) bill.billingType = billingType;
        if (discount !== undefined) bill.discount = Math.max(0, parseFloat(discount) || 0);
        if (discountType !== undefined) bill.discountType = discountType === "percentage" ? "percentage" : "fixed";
        if (discountReason !== undefined) bill.discountReason = discountReason || "";

        // Recalculate subtotal and line item discounts
        let calculatedSubtotal = 0;
        let itemDiscountsTotal = 0;

        const grossConsult = parseFloat(bill.consultationFee || 0);
        calculatedSubtotal += grossConsult;
        const rawConsultDisc = Math.max(0, parseFloat(bill.consultationDiscount || 0));
        let consultDiscAmount = 0;
        if (bill.consultationDiscountType === "percentage") {
            consultDiscAmount = (grossConsult * Math.min(100, rawConsultDisc)) / 100;
        } else {
            consultDiscAmount = Math.min(grossConsult, rawConsultDisc);
        }
        itemDiscountsTotal += consultDiscAmount;

        if (bill.tests && bill.tests.length > 0) {
            for (const t of bill.tests) {
                const grossTest = parseFloat(t.price || 0);
                calculatedSubtotal += grossTest;
                const tDisc = Math.max(0, parseFloat(t.discount || 0));
                let tDiscAmount = 0;
                if (t.discountType === "percentage") {
                    tDiscAmount = (grossTest * Math.min(100, tDisc)) / 100;
                } else {
                    tDiscAmount = Math.min(grossTest, tDisc);
                }
                itemDiscountsTotal += tDiscAmount;
            }
        }

        if (bill.medicines && bill.medicines.length > 0) {
            for (const m of bill.medicines) {
                const grossMed = (parseFloat(m.price) || 0) * (parseInt(m.quantity) || 1);
                calculatedSubtotal += grossMed;
                const mDisc = Math.max(0, parseFloat(m.discount || 0));
                let mDiscAmount = 0;
                if (m.discountType === "percentage") {
                    mDiscAmount = (grossMed * Math.min(100, mDisc)) / 100;
                } else {
                    mDiscAmount = Math.min(grossMed, mDisc);
                }
                itemDiscountsTotal += mDiscAmount;
            }
        }
        bill.subtotal = calculatedSubtotal;

        const netAfterItemDiscounts = Math.max(0, calculatedSubtotal - itemDiscountsTotal);
        const currentOverallDiscount = bill.discount || 0;
        let overallDiscountDeduction = 0;
        if (bill.discountType === "percentage") {
            overallDiscountDeduction = (netAfterItemDiscounts * Math.min(100, currentOverallDiscount)) / 100;
        } else {
            overallDiscountDeduction = Math.min(currentOverallDiscount, netAfterItemDiscounts);
        }
        bill.totalAmount = Math.max(0, calculatedSubtotal - (itemDiscountsTotal + overallDiscountDeduction));

        await bill.save();

        // Handle Follow-up Date via OpdReminder model
        let currentReminder = null;
        if (followUpDate !== undefined) {
            if (followUpDate) {
                const parsedFollowUp = new Date(followUpDate);
                if (!isNaN(parsedFollowUp.getTime())) {
                    const existingReminder = await OpdReminder.findOne({ billId: id });
                    const patientDoc = await OpdPatient.findById(bill.patientId);
                    const pName = patientDoc?.name || "Patient";
                    const msg = followUpNote?.trim() || `Follow-up consultation advised for ${pName} on ${parsedFollowUp.toLocaleDateString()}.`;
                    const now = new Date();
                    const diffDays = Math.ceil((parsedFollowUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const reminderStatus = (diffDays >= 0 && diffDays <= 3) ? "Sent" : (diffDays < 0 ? "Completed" : "Scheduled");

                    if (existingReminder) {
                        existingReminder.followUpDate = parsedFollowUp;
                        existingReminder.message = msg;
                        existingReminder.status = reminderStatus;
                        await existingReminder.save();
                        currentReminder = existingReminder.toObject();
                        emitOpdEvent("opd:reminder", {
                            type: "updated",
                            reminder: { ...currentReminder, patientId: patientDoc }
                        });
                    } else {
                        const newRem = await OpdReminder.create({
                            patientId: bill.patientId,
                            followUpDate: parsedFollowUp,
                            message: msg,
                            status: reminderStatus,
                            billId: id,
                            appointmentId: bill.appointmentId || null
                        });
                        currentReminder = newRem.toObject();
                        emitOpdEvent("opd:reminder", {
                            type: "created",
                            reminder: { ...currentReminder, patientId: patientDoc }
                        });
                    }
                }
            } else if (followUpDate === null || followUpDate === "") {
                const deletedRem = await OpdReminder.findOneAndDelete({ billId: id });
                if (deletedRem) {
                    emitOpdEvent("opd:reminder", {
                        type: "deleted",
                        reminderId: deletedRem._id
                    });
                }
            }
        } else {
            currentReminder = await OpdReminder.findOne({ billId: id }).lean();
        }

        const updatedBill = await OpdBilling.findById(id)
            .populate("patientId")
            .populate("appointmentId")
            .lean();

        const enrichedUpdatedBill = {
            ...updatedBill,
            followUpDate: currentReminder?.followUpDate || null,
            reminderId: currentReminder?._id || null,
            followUpReminder: currentReminder
        };

        emitOpdEvent("opd:bill", { type: "updated", bill: enrichedUpdatedBill });

        res.status(200).json({ message: "Bill updated successfully", bill: enrichedUpdatedBill });
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
        const deletedReminder = await OpdReminder.findOneAndDelete({ billId: id });
        if (deletedReminder) {
            emitOpdEvent("opd:reminder", { type: "deleted", reminderId: deletedReminder._id });
        }

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

export const getBillingSummary = async (req, res) => {
    try {
        const now = new Date();

        // Start of Today (local time)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Start of This Week (Monday 00:00:00)
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);

        // Start of This Month (1st day 00:00:00)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const allBills = await OpdBilling.find({})
            .populate("patientId", "name phone uhid age gender")
            .populate("appointmentId", "appointmentDate tokenNumber status")
            .sort({ createdAt: -1 })
            .lean();

        let totalBilled = 0;
        let totalPaid = 0;
        let totalDue = 0;
        let totalCount = allBills.length;
        let paidCount = 0;
        let dueCount = 0;

        let monthBilled = 0;
        let monthPaid = 0;
        let monthDue = 0;
        let monthCount = 0;
        let monthPaidCount = 0;
        let monthDueCount = 0;

        let weekBilled = 0;
        let weekPaid = 0;
        let weekDue = 0;
        let weekCount = 0;
        let weekPaidCount = 0;
        let weekDueCount = 0;

        let todayBilled = 0;
        let todayPaid = 0;
        let todayDue = 0;
        let todayCount = 0;
        let todayPaidCount = 0;
        let todayDueCount = 0;

        const dueInvoices = [];
        const recentPaidInvoices = [];

        for (const b of allBills) {
            const amt = parseFloat(b.totalAmount || 0);
            const isPaid = (b.status === "Paid" || b.status === "PAID" || b.paymentStatus === "Paid");
            const billDate = new Date(b.createdAt || now);

            // All Time Totals
            totalBilled += amt;
            if (isPaid) {
                totalPaid += amt;
                paidCount++;
                if (recentPaidInvoices.length < 10) {
                    recentPaidInvoices.push(b);
                }
            } else {
                totalDue += amt;
                dueCount++;
                dueInvoices.push(b);
            }

            // This Month
            if (billDate >= startOfMonth) {
                monthBilled += amt;
                monthCount++;
                if (isPaid) {
                    monthPaid += amt;
                    monthPaidCount++;
                } else {
                    monthDue += amt;
                    monthDueCount++;
                }
            }

            // This Week
            if (billDate >= startOfWeek) {
                weekBilled += amt;
                weekCount++;
                if (isPaid) {
                    weekPaid += amt;
                    weekPaidCount++;
                } else {
                    weekDue += amt;
                    weekDueCount++;
                }
            }

            // Today
            if (billDate >= startOfToday) {
                todayBilled += amt;
                todayCount++;
                if (isPaid) {
                    todayPaid += amt;
                    todayPaidCount++;
                } else {
                    todayDue += amt;
                    todayDueCount++;
                }
            }
        }

        const summary = {
            allTime: {
                totalBilled,
                totalPaid,
                totalDue,
                totalCount,
                paidCount,
                dueCount
            },
            thisMonth: {
                totalBilled: monthBilled,
                totalPaid: monthPaid,
                totalDue: monthDue,
                totalCount: monthCount,
                paidCount: monthPaidCount,
                dueCount: monthDueCount,
                monthName: now.toLocaleString("en-US", { month: "long", year: "numeric" })
            },
            thisWeek: {
                totalBilled: weekBilled,
                totalPaid: weekPaid,
                totalDue: weekDue,
                totalCount: weekCount,
                paidCount: weekPaidCount,
                dueCount: weekDueCount
            },
            today: {
                totalBilled: todayBilled,
                totalPaid: todayPaid,
                totalDue: todayDue,
                totalCount: todayCount,
                paidCount: todayPaidCount,
                dueCount: todayDueCount
            },
            dueInvoices,
            recentPaidInvoices
        };

        return res.status(200).json({ success: true, summary });
    } catch (error) {
        console.error("Get Billing Summary Error:", error);
        return res.status(500).json({ message: "Server error calculating billing summary" });
    }
};

