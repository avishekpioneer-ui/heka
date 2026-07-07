import OpdBilling from "../models/OpdBilling.js";
import OpdPatient from "../models/OpdPatient.js";
import OpdMedicine from "../models/OpdMedicine.js";
import { emitOpdEvent } from "../socket.js";

export const createBill = async (req, res) => {
    try {
        const { patientId, appointmentId, consultationFee, tests, medicines, billingType, status } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: "Patient ID is required" });
        }

        // Validate and reserve pharmacy stock before creating the bill
        if (medicines && medicines.length > 0) {
            const stockDocs = await OpdMedicine.find({ _id: { $in: medicines.map((m) => m.medicineId) } });
            for (const item of medicines) {
                const stockDoc = stockDocs.find((m) => m._id.toString() === item.medicineId);
                if (!stockDoc || stockDoc.stock < (item.quantity || 1)) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${item.name}. Available: ${stockDoc ? stockDoc.stock : 0}`
                    });
                }
            }
            await Promise.all(
                medicines.map((item) =>
                    OpdMedicine.updateOne({ _id: item.medicineId }, { $inc: { stock: -(item.quantity || 1) } })
                )
            );
        }

        // Calculate totalAmount
        let total = 0;
        if (consultationFee) total += parseFloat(consultationFee);
        if (tests && tests.length > 0) {
            total += tests.reduce((sum, t) => sum + parseFloat(t.price), 0);
        }
        if (medicines && medicines.length > 0) {
            total += medicines.reduce((sum, m) => sum + parseFloat(m.price || 0), 0);
        }

        const bill = await OpdBilling.create({
            patientId,
            appointmentId: appointmentId || null,
            consultationFee: consultationFee || 0,
            tests: tests || [],
            medicines: medicines || [],
            totalAmount: total,
            status: status || "Pending",
            billingType: billingType || "Combined"
        });

        emitOpdEvent("opd:bill", { type: "created", bill });

        res.status(201).json({ message: "Bill generated successfully", bill });
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
        res.status(200).json(bills);
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
        res.status(200).json(bill);
    } catch (error) {
        console.error("Get Bill By ID Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateBill = async (req, res) => {
    try {
        const { id } = req.params;
        const { consultationFee, tests, medicines, status, billingType } = req.body;

        const bill = await OpdBilling.findById(id);
        if (!bill) {
            return res.status(404).json({ message: "Bill not found" });
        }

        if (consultationFee !== undefined) bill.consultationFee = consultationFee;
        if (tests !== undefined) bill.tests = tests;
        if (medicines !== undefined) bill.medicines = medicines;
        if (status !== undefined) bill.status = status;
        if (billingType !== undefined) bill.billingType = billingType;

        // Recalculate totalAmount
        let total = 0;
        total += parseFloat(bill.consultationFee || 0);
        if (bill.tests && bill.tests.length > 0) {
            total += bill.tests.reduce((sum, t) => sum + parseFloat(t.price), 0);
        }
        if (bill.medicines && bill.medicines.length > 0) {
            total += bill.medicines.reduce((sum, m) => sum + parseFloat(m.price || 0), 0);
        }
        bill.totalAmount = total;

        await bill.save();
        res.status(200).json({ message: "Bill updated successfully", bill });
    } catch (error) {
        console.error("Update Bill Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const payBill = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await OpdBilling.findByIdAndUpdate(id, { status: "Paid" }, { new: true });
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
