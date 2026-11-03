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

export const enrichBillPaymentFields = (b) => {
    if (!b) return b;
    const totalAmount = Math.max(0, parseFloat(b.totalAmount || 0));
    let paidAmount = 0;
    if (Array.isArray(b.payments) && b.payments.length > 0) {
        paidAmount = b.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    } else if (b.status === "Paid" || b.status === "PAID" || b.paymentStatus === "Paid") {
        paidAmount = totalAmount;
    } else if (b.paidAmount !== undefined && b.paidAmount !== null) {
        paidAmount = parseFloat(b.paidAmount) || 0;
    }

    const dueAmount = b.dueAmount !== undefined && b.dueAmount !== null
        ? Math.max(0, parseFloat(b.dueAmount))
        : Math.max(0, totalAmount - paidAmount);

    let status = b.status || "Pending";
    if (paidAmount >= totalAmount && totalAmount > 0) {
        status = "Paid";
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
        status = "Partially Paid";
    } else if (status === "Paid" && totalAmount === 0) {
        status = "Paid";
    }

    return {
        ...b,
        paidAmount,
        dueAmount,
        status,
        payments: b.payments || []
    };
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
            paidAmount,
            paymentMethod,
            paymentNotes,
            paidAt,
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

        // Generate formatted Bill ID (ddmmyyyy000001)
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = String(now.getFullYear());
        const datePrefix = `${dd}${mm}${yyyy}`;

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const countToday = await OpdBilling.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } });
        let seq = countToday + 1;
        let invoiceNumber = `${datePrefix}${String(seq).padStart(6, '0')}`;
        while (await OpdBilling.exists({ invoiceNumber })) {
            seq++;
            invoiceNumber = `${datePrefix}${String(seq).padStart(6, '0')}`;
        }

        const rawPaid = parseFloat(paidAmount || 0);
        let finalStatus = status || paymentStatus || "Pending";
        let finalPaid = 0;
        let initialPayments = [];

        if (finalStatus === "Paid" || rawPaid >= total) {
            finalPaid = total;
            finalStatus = "Paid";
            if (total > 0) {
                initialPayments.push({
                    amount: total,
                    paymentMethod: paymentMethod || "Cash",
                    paidAt: paidAt ? new Date(paidAt) : new Date(),
                    notes: paymentNotes || "Full payment at checkout"
                });
            }
        } else if (rawPaid > 0) {
            finalPaid = Math.min(total, rawPaid);
            finalStatus = finalPaid >= total ? "Paid" : "Partially Paid";
            initialPayments.push({
                amount: finalPaid,
                paymentMethod: paymentMethod || "Cash",
                paidAt: paidAt ? new Date(paidAt) : new Date(),
                notes: paymentNotes || "Initial part payment"
            });
        } else {
            finalPaid = 0;
            finalStatus = "Pending";
        }

        const finalDue = Math.max(0, total - finalPaid);

        const bill = await OpdBilling.create({
            patientId,
            appointmentId: appointmentId || null,
            invoiceNumber,
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
            paidAmount: finalPaid,
            dueAmount: finalDue,
            payments: initialPayments,
            paymentMethod: paymentMethod || "Cash",
            status: finalStatus,
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

        const enrichedBill = enrichBillPaymentFields({
            ...populatedBill,
            followUpDate: createdReminder?.followUpDate || null,
            reminderId: createdReminder?._id || null,
            followUpReminder: createdReminder ? createdReminder.toObject() : null
        });

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
                return enrichBillPaymentFields({
                    ...b,
                    subtotal: sub,
                    discount: b.discount || 0,
                    discountType: b.discountType || "fixed",
                    discountReason: b.discountReason || "",
                    followUpDate: rem?.followUpDate || null,
                    reminderId: rem?._id || null,
                    followUpReminder: rem || null
                });
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
            return enrichBillPaymentFields({
                ...b,
                subtotal: sub,
                discount: b.discount || 0,
                discountType: b.discountType || "fixed",
                discountReason: b.discountReason || "",
                followUpDate: rem?.followUpDate || null,
                reminderId: rem?._id || null,
                followUpReminder: rem || null
            });
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
        res.status(200).json(enrichBillPaymentFields({
            ...bill,
            subtotal: sub,
            discount: bill.discount || 0,
            discountType: bill.discountType || "fixed",
            discountReason: bill.discountReason || "",
            followUpDate: rem?.followUpDate || null,
            reminderId: rem?._id || null,
            followUpReminder: rem || null
        }));
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

        // Recalculate payments and dueAmount
        let currentPaid = 0;
        if (bill.payments && bill.payments.length > 0) {
            currentPaid = bill.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        } else if (bill.status === "Paid") {
            currentPaid = bill.totalAmount;
        } else {
            currentPaid = parseFloat(bill.paidAmount) || 0;
        }
        bill.paidAmount = currentPaid;
        bill.dueAmount = Math.max(0, bill.totalAmount - currentPaid);

        if (bill.paidAmount >= bill.totalAmount && bill.totalAmount > 0) {
            bill.status = "Paid";
        } else if (bill.paidAmount > 0) {
            bill.status = "Partially Paid";
        } else if (status !== undefined || paymentStatus !== undefined) {
            bill.status = status || paymentStatus;
        }

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

        const enrichedUpdatedBill = enrichBillPaymentFields({
            ...updatedBill,
            followUpDate: currentReminder?.followUpDate || null,
            reminderId: currentReminder?._id || null,
            followUpReminder: currentReminder
        });

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
        const {
            amount,
            paymentMethod = "Cash",
            paidAt,
            notes = "",
            transactionId = "",
            receiptNumber = ""
        } = req.body;

        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        let currentPaid = 0;
        if (Array.isArray(bill.payments) && bill.payments.length > 0) {
            currentPaid = bill.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        } else if (bill.status === "Paid") {
            currentPaid = parseFloat(bill.totalAmount) || 0;
        } else {
            currentPaid = parseFloat(bill.paidAmount) || 0;
        }

        const remainingDue = Math.max(0, (parseFloat(bill.totalAmount) || 0) - currentPaid);

        let payAmount = remainingDue;
        if (amount !== undefined && amount !== null && amount !== "") {
            payAmount = parseFloat(amount);
        }

        if (isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than zero." });
        }

        const newPayment = {
            amount: payAmount,
            paymentMethod: paymentMethod || "Cash",
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            notes: notes || (payAmount >= remainingDue ? "Final settlement payment" : "Part payment installment"),
            transactionId: transactionId || "",
            receiptNumber: receiptNumber || ""
        };

        if (!bill.payments) {
            bill.payments = [];
        }
        bill.payments.push(newPayment);

        const newTotalPaid = currentPaid + payAmount;
        bill.paidAmount = newTotalPaid;
        bill.dueAmount = Math.max(0, (parseFloat(bill.totalAmount) || 0) - newTotalPaid);
        bill.paymentMethod = paymentMethod || "Cash";

        if (newTotalPaid >= (parseFloat(bill.totalAmount) || 0)) {
            bill.status = "Paid";
        } else {
            bill.status = "Partially Paid";
        }

        await bill.save();

        const populatedBill = await OpdBilling.findById(id)
            .populate("patientId")
            .populate("appointmentId")
            .lean();

        const rem = await OpdReminder.findOne({ billId: id }).lean();
        const enrichedBill = enrichBillPaymentFields({
            ...populatedBill,
            followUpDate: rem?.followUpDate || null,
            reminderId: rem?._id || null,
            followUpReminder: rem || null
        });

        emitOpdEvent("opd:bill", { type: bill.status === "Paid" ? "paid" : "updated", bill: enrichedBill });

        const message = bill.status === "Paid"
            ? "Full payment recorded. Invoice marked as Paid."
            : `Part payment of ₹${payAmount} recorded successfully. Remaining balance: ₹${bill.dueAmount}.`;

        res.status(200).json({ message, bill: enrichedBill });
    } catch (error) {
        console.error("Pay Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deletePayment = async (req, res) => {
    try {
        const { id, paymentId } = req.params;
        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        bill.payments = (bill.payments || []).filter(p => p._id.toString() !== paymentId);
        const newTotalPaid = bill.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        bill.paidAmount = newTotalPaid;
        bill.dueAmount = Math.max(0, (parseFloat(bill.totalAmount) || 0) - newTotalPaid);

        if (newTotalPaid >= (parseFloat(bill.totalAmount) || 0) && (parseFloat(bill.totalAmount) || 0) > 0) {
            bill.status = "Paid";
        } else if (newTotalPaid > 0) {
            bill.status = "Partially Paid";
        } else {
            bill.status = "Pending";
        }

        await bill.save();

        const populatedBill = await OpdBilling.findById(id)
            .populate("patientId")
            .populate("appointmentId")
            .lean();

        const rem = await OpdReminder.findOne({ billId: id }).lean();
        const enrichedBill = enrichBillPaymentFields({
            ...populatedBill,
            followUpDate: rem?.followUpDate || null,
            reminderId: rem?._id || null,
            followUpReminder: rem || null
        });

        emitOpdEvent("opd:bill", { type: "updated", bill: enrichedBill });
        res.status(200).json({ message: "Payment entry removed successfully", bill: enrichedBill });
    } catch (error) {
        console.error("Delete Payment Error:", error);
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
        let partialCount = 0;
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

        for (const rawB of allBills) {
            const b = enrichBillPaymentFields(rawB);
            const amt = parseFloat(b.totalAmount || 0);
            const paid = parseFloat(b.paidAmount || 0);
            const due = parseFloat(b.dueAmount || 0);
            const billDate = new Date(b.createdAt || now);

            // All Time Totals
            totalBilled += amt;
            totalPaid += paid;
            totalDue += due;

            if (b.status === "Paid") {
                paidCount++;
            } else if (b.status === "Partially Paid") {
                partialCount++;
                dueCount++;
            } else {
                dueCount++;
            }

            if (due > 0) {
                dueInvoices.push(b);
            }
            if (paid > 0 && recentPaidInvoices.length < 20) {
                recentPaidInvoices.push(b);
            }

            // This Month Billed & Due
            if (billDate >= startOfMonth) {
                monthBilled += amt;
                monthDue += due;
                monthCount++;
                if (b.status === "Paid") monthPaidCount++;
                if (due > 0) monthDueCount++;
            }

            // This Week Billed & Due
            if (billDate >= startOfWeek) {
                weekBilled += amt;
                weekDue += due;
                weekCount++;
                if (b.status === "Paid") weekPaidCount++;
                if (due > 0) weekDueCount++;
            }

            // Today Billed & Due
            if (billDate >= startOfToday) {
                todayBilled += amt;
                todayDue += due;
                todayCount++;
                if (b.status === "Paid") todayPaidCount++;
                if (due > 0) todayDueCount++;
            }

            // Calculate Period Collections from Payments array
            if (Array.isArray(b.payments) && b.payments.length > 0) {
                for (const p of b.payments) {
                    const pDate = new Date(p.paidAt || b.createdAt || now);
                    const pAmt = parseFloat(p.amount || 0);
                    if (pDate >= startOfToday) todayPaid += pAmt;
                    if (pDate >= startOfWeek) weekPaid += pAmt;
                    if (pDate >= startOfMonth) monthPaid += pAmt;
                }
            } else if (paid > 0) {
                if (billDate >= startOfToday) todayPaid += paid;
                if (billDate >= startOfWeek) weekPaid += paid;
                if (billDate >= startOfMonth) monthPaid += paid;
            }
        }

        const summary = {
            allTime: {
                totalBilled,
                totalPaid,
                totalDue,
                totalCount,
                paidCount,
                partialCount,
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

