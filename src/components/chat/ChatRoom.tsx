"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";
import styles from "./ChatRoom.module.css";

interface Message {
  id: string;
  content: string;
  senderId: string | null;
  isSystem: boolean;
  timestamp: Date;
}

export default function ChatRoom({ roomId, buyerName, sellerName, isLocked = false }: { roomId: string, buyerName: string, sellerName: string, isLocked?: boolean }) {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  const userId = (session?.user as any)?.id;
  const { isConnected, sendMessage, messages, usersTyping, sendTyping } = useSocket(userId, roomId);

  // Auto-scroll to bottom only when new messages arrive *and* user is already near bottom
  // or if it's the current user sending a message.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 150;
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.senderId === userId;

      if (isNearBottom || isOwnMessage) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, userId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isLocked) return;

    sendMessage(input);
    setInput("");
    setIsTyping(false);
    sendTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Trigger typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }

    // Clear typing indicator after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 2000);
  };

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <h3>Negotiation: {buyerName} & {sellerName}</h3>
        <span className={styles.status}>
          {isConnected ? (
            <span className={styles.connected}>● Connected</span>
          ) : (
            <span className={styles.disconnected}>● Connecting...</span>
          )}
        </span>
      </div>

      <div className={styles.messages}>
        {messages.map((m) =>
          m.isSystem ? (
            <div key={m.id} className={styles.systemMessage}>
              <span>{m.content}</span>
            </div>
          ) : (
            <div
              key={m.id}
              className={`${styles.message} ${m.senderId === userId ? styles.own : ""}`}
            >
              <div className={styles.bubble}>{m.content}</div>
              <span className={styles.time}>
                {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )
        )}

        {usersTyping.size > 0 && (
          <div className={styles.typingIndicator}>
            <span>Someone is typing</span>
            <div className={styles.dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isLocked ? "Negotiation closed... chat is locked." : "Enter offer or message..."}
          className={styles.input}
          disabled={!isConnected || isLocked}
        />
        <button type="submit" className={styles.sendBtn} disabled={!isConnected || isLocked}>
          Send
        </button>
      </form>
    </div>
  );
}
