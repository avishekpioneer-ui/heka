import OpdTest from "../models/OpdTest.js";

export const createTest = async (req, res) => {
    try {
        const { name, price, code, category } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "Test name and price are required" });
        }

        const existingTest = await OpdTest.findOne({ name: name.trim() });
        if (existingTest) {
            return res.status(409).json({ message: "Test already exists" });
        }

        const test = await OpdTest.create({
            name: name.trim(),
            price,
            code: code?.trim(),
            category: category?.trim() || "General Pathology"
        });
        res.status(201).json({ message: "Diagnostic test added successfully", test });
    } catch (error) {
        console.error("Create Test Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getTests = async (req, res) => {
    try {
        const { search, page, limit, all } = req.query;

        let query = {};
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            query = {
                $or: [
                    { name: regex },
                    { code: regex },
                    { category: regex }
                ]
            };
        }

        // If 'all=true' or no pagination parameters & no search are provided, return all as an array
        if (all === "true" || (!page && !limit && !search)) {
            const tests = await OpdTest.find(query).sort({ name: 1 });
            return res.status(200).json(tests);
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNum - 1) * limitNum;

        const [tests, total] = await Promise.all([
            OpdTest.find(query).sort({ name: 1 }).skip(skip).limit(limitNum),
            OpdTest.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limitNum) || 1;

        res.status(200).json({
            tests,
            total,
            page: pageNum,
            totalPages,
            limit: limitNum
        });
    } catch (error) {
        console.error("Get Tests Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateTest = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, code, category } = req.body;

        const test = await OpdTest.findById(id);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        if (name) test.name = name.trim();
        if (price !== undefined) test.price = price;
        if (code !== undefined) test.code = code.trim();
        if (category !== undefined) test.category = category.trim();

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
