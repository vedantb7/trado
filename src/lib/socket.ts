import type { Server as HTTPServer } from "http";
import prisma from "./prisma";

let io: any = null;

export function initializeSocket(httpServer: HTTPServer) {
  const { Server } = require("socket.io");
  
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: any) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Join a specific chat room
    socket.on("join_room", async (roomId: string, userId: string) => {
      socket.join(roomId);
      console.log(`[Socket] User ${userId} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit("user_joined", { userId, timestamp: new Date() });
    });

    // Send a message in the room
    socket.on("send_message", async (data: any) => {
      const { roomId, senderId, content } = data;
      
      try {
        // Save message to database
        const message = await prisma.message.create({
          data: {
            roomId,
            senderId,
            content,
          },
        });

        // Broadcast to all in room
        io?.to(roomId).emit("receive_message", {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          timestamp: message.timestamp,
        });
      } catch (error) {
        console.error("[Socket] Error saving message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Update offer status in real-time
    socket.on("offer_updated", (data: any) => {
      const { offerId, status, roomId } = data;
      io?.to(roomId).emit("offer_status_changed", {
        offerId,
        status,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on("typing", (data: any) => {
      const { roomId, userId, isTyping } = data;
      socket.to(roomId).emit("user_typing", { userId, isTyping });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  // Returns the io instance from the custom server (server.js stores it in global._io)
  return (global as any)._io || io;
}
