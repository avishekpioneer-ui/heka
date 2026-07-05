import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import opdRoutes from "./opd/routes/index.js";
import { startReminderScheduler } from "./opd/services/reminder.service.js";
import { initOpdSocket } from "./opd/socket.js";

dotenv.config();

const app = express();

// middleware
app.use(cors({
    origin: "*"
}));
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/opd", opdRoutes);

// test route
app.get("/", (req, res) => {
    res.send("🚀 Backend running fine");
});

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

connectDB().then(() => {
    startReminderScheduler();
    initOpdSocket(httpServer);
    httpServer.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
    });
});