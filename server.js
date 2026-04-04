/**
 * Bazaar@IITGN Custom Node.js Server
 * ----------------------------------
 * This server uses Express and Socket.io to provide a stable real-time 
 * communication layer for the Next.js application.
 * 
 * Why a custom server?
 * Next.js App Router (v13+) has limited support for persistent WebSockets 
 * in the edge/serverless runtime. This Node.js bridge ensures that 
 * negotiation chats and dashboard updates are delivered instantly.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3001; // Match the user's current environment
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", (data) => {
        const { roomId } = data;
        io.to(roomId).emit("receive_message", data);
    });

    // Global events for dashboard updates
    socket.on("new_offer", ({ sellerId, offerId }) => {
        io.emit("offer_received", { sellerId, offerId });
        console.log(`Global: New offer for seller ${sellerId}`);
    });

    socket.on("offer_updated", (data) => {
        io.emit("offer_status_changed", data);
        console.log(`Global: Offer updated: ${data.offerId}`);
    });

    socket.on("typing", (data) => {
        const { roomId, userId, isTyping } = data;
        socket.to(roomId).emit("user_typing", { userId, isTyping });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
