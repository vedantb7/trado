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
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT, 10) || 3001; 
const app = next({ dev });
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

  // Store globally so Next.js API routes can emit events
  global._io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("send_message", async (data) => {
        const { roomId, senderId, content } = data;
        try {
            // BACKEND SECURITY: Prevent messaging if the deal is closed
            const offer = await prisma.offer.findFirst({
                where: { room: { id: roomId } }
            });
            
            if (offer && (offer.status === "Completed" || offer.status === "Declined")) {
                console.log(`Blocked message: Chat for offer ${offer.id} is locked.`);
                return; // Drop the message entirely
            }

            // Persist message to database if open
            const savedMessage = await prisma.message.create({
                data: {
                    roomId,
                    senderId,
                    content
                }
            });
            // Broadcast the saved record (includes unique ID and timestamp)
            io.to(roomId).emit("receive_message", savedMessage);
            console.log(`Chat: Message saved to room ${roomId}`);
        } catch (error) {
            console.error("Failed to save socket message:", error);
        }
    });

    // Global events for dashboard updates
    socket.on("new_offer", (data) => {
        io.emit("offer_received", data);
        console.log(`Global: New offer for seller ${data.sellerId}`);
    });

    socket.on("offer_updated", (data) => {
        io.emit("offer_status_changed", data);
        console.log(`Global: Offer updated: ${data.offerId}`);
    });

    // Relay pre-saved system messages to a specific room
    socket.on("broadcast_message", (data) => {
        io.to(data.roomId).emit("receive_message", data);
    });

    // Next.js App Router API mitigation: Clients emit these to trigger a global broadcast
    socket.on("create_listing", (data) => {
        io.emit("listing_created", data);
        console.log(`Global: New listing broadcasted: ${data.id}`);
    });

    socket.on("create_offer", (data) => {
        // Broadcasts to target seller's dashboard directly
        io.emit("new_offer", data);
        console.log(`Global: New offer for seller ${data.sellerId}`);
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
      console.log(`> Ready on port ${port}`);
    });
});
