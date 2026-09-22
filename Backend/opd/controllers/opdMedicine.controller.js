import OpdMedicine from "../models/OpdMedicine.js";

export const createMedicine = async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Medicine name is required" });
        }

        const existingMed = await OpdMedicine.findOne({ name: name.trim() });
        if (existingMed) {
            return res.status(409).json({ message: "Medicine already exists" });
        }

        const medicine = await OpdMedicine.create({ name: name.trim(), price: price !== undefined ? price : 0, stock: stock || 0 });
        res.status(201).json({ message: "Medicine added successfully", medicine });
    } catch (error) {
        console.error("Create Medicine Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMedicines = async (req, res) => {
    try {
        const { search, page, limit, all } = req.query;

        let query = {};
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query.name = regex;
        }

        // If 'all=true' or no pagination parameters & no search are provided, return all as an array
        if (all === "true" || (!page && !limit && !search)) {
            const medicines = await OpdMedicine.find(query).sort({ name: 1 });
            return res.status(200).json(medicines);
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNum - 1) * limitNum;

        const [medicines, total] = await Promise.all([
            OpdMedicine.find(query).sort({ name: 1 }).skip(skip).limit(limitNum),
            OpdMedicine.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum) || 1;

        res.status(200).json({
            medicines,
            total,
            page: pageNum,
            totalPages,
            limit: limitNum
        });
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
