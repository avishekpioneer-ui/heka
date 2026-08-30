import OpdTestOrder from "../models/OpdTestOrder.js";
import OpdTest from "../models/OpdTest.js";
import OpdBilling from "../models/OpdBilling.js";
import { emitOpdEvent } from "../socket.js";

export const createTestOrder = async (req, res) => {
    return res.status(400).json({
        message: "Direct test booking is disabled. Test orders must be prescribed during patient consultation or added via OPD billing."
    });
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
