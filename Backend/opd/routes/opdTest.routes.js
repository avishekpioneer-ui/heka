import express from "express";
import { createTest, getTests, updateTest, deleteTest } from "../controllers/opdTest.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission(["manage_tests", "manage_billing"]), getTests);
router.post("/", requirePermission("manage_tests"), createTest);
router.put("/:id", requirePermission("manage_tests"), updateTest);
router.delete("/:id", requirePermission("manage_tests"), deleteTest);

export default router;
