import express from "express";
import { createTestOrder, getTestOrders, updateTestOrderStatus } from "../controllers/opdTestOrder.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission(["manage_tests", "manage_consultations"]), createTestOrder);
router.get("/", requirePermission(["manage_tests", "manage_consultations", "manage_billing"]), getTestOrders);
router.put("/:id/status", requirePermission(["manage_tests", "manage_consultations"]), updateTestOrderStatus);

export default router;
