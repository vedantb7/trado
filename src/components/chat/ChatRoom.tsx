"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./ChatRoom.module.css";

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

export default function ChatRoom({ roomId, buyerName, sellerName }: { roomId: string, buyerName: string, sellerName: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Socket.emit("send_message", { roomId, content: input });
    const newMessage: Message = {
      id: Math.random().toString(),
      content: input,
      senderId: (session?.user as any).id,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <h3>Negotiation: {buyerName} & {sellerName}</h3>
      </div>
      
      <div className={styles.messages}>
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`${styles.message} ${m.senderId === (session?.user as any).id ? styles.own : ""}`}
          >
            <div className={styles.bubble}>{m.content}</div>
            <span className={styles.time}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className={styles.inputArea}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter offer or message..."
          className={styles.input}
        />
        <button type="submit" className={styles.sendBtn}>Send</button>
      </form>
    </div>
  );
}
