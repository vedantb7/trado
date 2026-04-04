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

    const isSystemRoom = ["listings", "dashboard", "notifications"].includes(roomId);

    // Connect to socket server once if not already initialized
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
      });

      socket.on("disconnect", () => {
        console.log("[Socket Hook] Disconnected");
        setIsConnected(false);
      });

      socket.on("error", (error: any) => {
        console.error("[Socket Hook] Socket error:", error);
      });
    } else {
      // Synchronize connection state if socket already exists
      setIsConnected(socket.connected);
    }

    // Always join the room whenever roomId or userId changes
    if (socket.connected) {
      socket.emit("join_room", roomId, userId);
    } else {
      socket.once("connect", () => {
        socket!.emit("join_room", roomId, userId);
      });
    }

    // Listener for new messages (ONLY for private rooms)
    const handleReceiveMessage = (data: any) => {
      setMessages((prev) => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
      });
    };

    // Listener for typing status (ONLY for private rooms)
    const handleUserTyping = (data: any) => {
      const { userId: typingUserId, isTyping } = data;
      if (typingUserId === userId) return;
      setUsersTyping((prev) => {
        const newSet = new Set(prev);
        if (isTyping) newSet.add(typingUserId);
        else newSet.delete(typingUserId);
        return newSet;
      });
    };

    if (!isSystemRoom) {
      socket.on("receive_message", handleReceiveMessage);
      socket.on("user_typing", handleUserTyping);

      // Fetch initial messages
      const fetchMessages = async () => {
        try {
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
    }

    return () => {
      if (socket) {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("user_typing", handleUserTyping);
      }
    };
  }, [userId, roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socket && socket.connected) {
        socket.emit("send_message", { roomId, senderId: userId, content });
      }
    },
    [roomId, userId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (socket && socket.connected) {
        socket.emit("typing", { roomId, userId, isTyping });
      }
    },
    [roomId, userId]
  );

  const emitOfferUpdate = useCallback(
    (offerId: string, status: string, data?: any) => {
      if (socket && socket.connected) {
        socket.emit("offer_updated", { offerId, status, roomId, ...data });
      }
    },
    [roomId]
  );

  const emitCreateListing = useCallback(
    (listingData: any) => {
      if (socket && socket.connected) {
        socket.emit("create_listing", listingData);
      }
    },
    []
  );

  const emitCreateOffer = useCallback(
    (sellerId: string, offerId: string) => {
      if (socket && socket.connected) {
        socket.emit("create_offer", { sellerId, offerId });
      }
    },
    []
  );

  return {
    isConnected,
    sendMessage,
    sendTyping,
    messages,
    usersTyping,
    emitOfferUpdate,
    emitCreateListing,
    emitCreateOffer,
    socket,
  };
}

