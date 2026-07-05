import express from "express";
import { loginOpdUser, getOpdProfile } from "../controllers/opdAuth.controller.js";
import { verifyOpdUser } from "../middleware/opdAuth.js";

const router = express.Router();

router.post("/login", loginOpdUser);
router.get("/profile", verifyOpdUser, getOpdProfile);

export default router;
