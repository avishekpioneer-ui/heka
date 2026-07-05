import OpdMedicine from "../models/OpdMedicine.js";

export const createMedicine = async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "Medicine name and price are required" });
        }

        const existingMed = await OpdMedicine.findOne({ name: name.trim() });
        if (existingMed) {
            return res.status(409).json({ message: "Medicine already exists" });
        }

        const medicine = await OpdMedicine.create({ name: name.trim(), price, stock: stock || 0 });
        res.status(201).json({ message: "Medicine added successfully", medicine });
    } catch (error) {
        console.error("Create Medicine Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMedicines = async (req, res) => {
    try {
        const medicines = await OpdMedicine.find({}).sort({ name: 1 });
        res.status(200).json(medicines);
    } catch (error) {
        console.error("Get Medicines Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock } = req.body;

        const medicine = await OpdMedicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        if (name) medicine.name = name.trim();
        if (price !== undefined) medicine.price = price;
        if (stock !== undefined) medicine.stock = stock;

        await medicine.save();
        res.status(200).json({ message: "Medicine updated successfully", medicine });
    } catch (error) {
        console.error("Update Medicine Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const restockMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "A positive restock quantity is required" });
        }

        const medicine = await OpdMedicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        medicine.stock += Number(quantity);
        await medicine.save();

        res.status(200).json({ message: "Stock updated successfully", medicine });
    } catch (error) {
        console.error("Restock Medicine Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await OpdMedicine.findByIdAndDelete(id);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }
        res.status(200).json({ message: "Medicine deleted successfully" });
    } catch (error) {
        console.error("Delete Medicine Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
