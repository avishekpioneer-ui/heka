import express from "express";
import { getDashboardStats } from "../controllers/opdDashboard.controller.js";
import { verifyOpdUser } from "../middleware/opdAuth.js";

const router = express.Router();

router.use(verifyOpdUser);

router.get("/stats", getDashboardStats);

export default router;
