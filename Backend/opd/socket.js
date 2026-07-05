import { Server } from "socket.io";
import { resolveOpdIdentity } from "./middleware/opdAuth.js";

let io = null;

export const initOpdSocket = (httpServer) => {
    io = new Server(httpServer, {
        path: "/api/opd/socket.io",
        cors: { origin: "*" }
    });

    io.use(async (socket, next) => {
        try {
            const userId = socket.handshake.auth?.userId;
            const user = await resolveOpdIdentity(userId);
            if (!user) {
                return next(new Error("Unauthorized"));
            }
            socket.data.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        socket.join("opd");
        socket.on("disconnect", () => {});
    });

    console.log("🔌 OPD Socket.IO layer initialized");
    return io;
};

// Broadcasts an event to every connected OPD staff/admin session.
// No-op (with a warning) if called before the socket layer is initialized,
// so controllers can call this unconditionally without extra null checks.
export const emitOpdEvent = (event, payload) => {
    if (!io) {
        console.warn(`OPD Socket not initialized, dropped event: ${event}`);
        return;
    }
    io.to("opd").emit(event, payload);
};
