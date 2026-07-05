import OpdTestOrder from "../models/OpdTestOrder.js";
import OpdTest from "../models/OpdTest.js";
import OpdBilling from "../models/OpdBilling.js";
import { emitOpdEvent } from "../socket.js";

export const createTestOrder = async (req, res) => {
    try {
        const { patientId, testId, scheduledDate, notes } = req.body;

        if (!patientId || !testId) {
            return res.status(400).json({ message: "Patient and Test are required" });
        }

        const test = await OpdTest.findById(testId);
        if (!test) {
            return res.status(404).json({ message: "Diagnostic test not found in catalog" });
        }

        const order = await OpdTestOrder.create({
            patientId,
            testId,
            testName: test.name,
            price: test.price,
            scheduledDate: scheduledDate || null,
            notes: notes || ""
        });

        // Automatically generate the matching diagnostic bill, same pattern as
        // the consultation bill auto-created when an appointment is booked.
        const bill = await OpdBilling.create({
            patientId,
            tests: [{ testId: test._id, name: test.name, price: test.price }],
            totalAmount: test.price,
            status: "Pending",
            billingType: "Diagnostic"
        });

        order.billId = bill._id;
        await order.save();

        emitOpdEvent("opd:testorder", { type: "created", order });
        emitOpdEvent("opd:bill", { type: "created", bill });

        res.status(201).json({ message: "Diagnostic test scheduled and bill generated", order, bill });
    } catch (error) {
        console.error("Create Test Order Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTestOrders = async (req, res) => {
    try {
        const { patientId, status } = req.query;
        const query = {};
        if (patientId) query.patientId = patientId;
        if (status) query.status = status;

        const orders = await OpdTestOrder.find(query)
            .populate("patientId")
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Get Test Orders Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTestOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Ordered", "Collected", "Reported"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await OpdTestOrder.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ message: "Test order not found" });
        }

        emitOpdEvent("opd:testorder", { type: "updated", order });

        res.status(200).json({ message: `Test order marked as ${status}`, order });
    } catch (error) {
        console.error("Update Test Order Status Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
