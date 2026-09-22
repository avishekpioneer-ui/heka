import express from "express";
import { createTestOrder, getTestOrders, updateTestOrderStatus } from "../controllers/opdTestOrder.controller.js";
import { verifyOpdUser, requirePermission } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.post("/", requirePermission(["tests:add", "consultations:add"]), createTestOrder);
router.get("/", requirePermission(["tests:read", "consultations:read", "billing:read"]), getTestOrders);
router.put("/:id/status", requirePermission(["tests:edit", "consultations:edit"]), updateTestOrderStatus);

export default router;
