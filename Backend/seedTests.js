import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpdTest from "./opd/models/OpdTest.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedTests = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const dataPath = path.join(__dirname, "data", "labTests.json");
        if (!fs.existsSync(dataPath)) {
            throw new Error(`Data file not found at: ${dataPath}`);
        }

        const tests = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        console.log(`📋 Found ${tests.length} tests to import into database.`);

        // Build bulk upsert operations
        const operations = tests.map(test => ({
            updateOne: {
                filter: { name: test.name },
                update: {
                    $set: {
                        name: test.name,
                        price: test.price,
                        code: test.code,
                        category: test.category || "General Pathology"
                    }
                },
                upsert: true
            }
        }));

        console.log("⏳ Executing bulkWrite operations...");
        const result = await OpdTest.bulkWrite(operations);

        console.log("==========================================");
        console.log("✅ Diagnostic Tests Seeding Completed!");
        console.log(`Matched Count:  ${result.matchedCount}`);
        console.log(`Modified Count: ${result.modifiedCount}`);
        console.log(`Upserted Count: ${result.upsertedCount}`);
        console.log("==========================================");

        const totalInDb = await OpdTest.countDocuments();
        console.log(`📊 Total OpdTest documents in DB: ${totalInDb}`);

        const sample = await OpdTest.find().sort({ code: 1 }).limit(3);
        console.log("🔍 Sample imported tests:");
        sample.forEach(t => console.log(` - [${t.code}] ${t.name}: ₹${t.price} (${t.category})`));

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding diagnostic tests:", error);
        process.exit(1);
    }
};

seedTests();
