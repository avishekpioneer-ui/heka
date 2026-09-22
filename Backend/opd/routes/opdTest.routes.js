import express from "express";
import { createTest, getTests, updateTest, deleteTest } from "../controllers/opdTest.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/", requirePermission(["tests:read", "billing:read"]), getTests);
router.post("/", requirePermission("tests:add"), createTest);
router.put("/:id", requirePermission("tests:edit"), updateTest);
router.delete("/:id", requirePermission("tests:delete"), deleteTest);

export default router;
