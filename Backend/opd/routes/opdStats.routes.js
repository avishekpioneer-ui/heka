import express from "express";
import { getDashboardStats } from "../controllers/opdStats.controller.js";

const router = express.Router();

router.get("/", getDashboardStats);

export default router;
