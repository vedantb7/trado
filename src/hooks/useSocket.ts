"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function useSocket(userId: string | undefined, roomId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [usersTyping, setUsersTyping] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !roomId) return;

    // Fetch initial messages from the room API
    const fetchMessages = async () => {
      try {
        // We'll use the offer API that now returns messages
        // Since we only have roomId, we need to ensure the backend can resolve this
        // Or we pass offerId to useSocket. Fix: Assuming roomId is the offerId for now or 
        // using a separate messages endpoint.
        const response = await fetch(`/api/messages?roomId=${roomId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("[Socket Hook] Failed to fetch initial messages:", error);
      }
    };

    fetchMessages();

    // Connect to socket server
    if (!socket) {
      socket = io(undefined as any, {
        path: "/api/socket",
        addTrailingSlash: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("[Socket Hook] Connected");
        setIsConnected(true);
        socket!.emit("join_room", roomId, userId);
      });

      socket.on("receive_message", (data: any) => {
        setMessages((prev) => [...prev, data]);
      });

      socket.on("user_typing", (data: any) => {
        const { userId: typingUserId, isTyping } = data;
        if (typingUserId === userId) return; // Ignore own typing messages
        setUsersTyping((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(typingUserId);
          } else {
            newSet.delete(typingUserId);
          }
          return newSet;
        });
      });

      socket.on("disconnect", () => {
        console.log("[Socket Hook] Disconnected");
        setIsConnected(false);
      });

      socket.on("error", (error: any) => {
        console.error("[Socket Hook] Socket error:", error);
      });
    }

    return () => {
      if (socket) {
        socket.off("receive_message");
        socket.off("user_typing");
      }
    };
  }, [userId, roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socket && isConnected) {
        socket.emit("send_message", { roomId, senderId: userId, content });
      }
    },
    [roomId, userId, isConnected]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (socket && isConnected) {
        socket.emit("typing", { roomId, userId, isTyping });
      }
    },
    [roomId, userId, isConnected]
  );

  const emitOfferUpdate = useCallback(
    (offerId: string, status: string) => {
      if (socket && isConnected) {
        socket.emit("offer_updated", { offerId, status, roomId });
      }
    },
    [roomId, isConnected]
  );

  return {
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    usersTyping,
    emitOfferUpdate,
  };
}
