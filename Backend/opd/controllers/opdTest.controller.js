import OpdTest from "../models/OpdTest.js";

export const createTest = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "Test name and price are required" });
        }

        const existingTest = await OpdTest.findOne({ name: name.trim() });
        if (existingTest) {
            return res.status(409).json({ message: "Test already exists" });
        }

        const test = await OpdTest.create({ name: name.trim(), price });
        res.status(201).json({ message: "Diagnostic test added successfully", test });
    } catch (error) {
        console.error("Create Test Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTests = async (req, res) => {
    try {
        const tests = await OpdTest.find({}).sort({ name: 1 });
        res.status(200).json(tests);
    } catch (error) {
        console.error("Get Tests Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const test = await OpdTest.findById(id);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        if (name) test.name = name.trim();
        if (price !== undefined) test.price = price;

        await test.save();
        res.status(200).json({ message: "Diagnostic test updated successfully", test });
    } catch (error) {
        console.error("Update Test Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteTest = async (req, res) => {
    try {
        const { id } = req.params;
        const test = await OpdTest.findByIdAndDelete(id);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        res.status(200).json({ message: "Diagnostic test deleted successfully" });
    } catch (error) {
        console.error("Delete Test Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
