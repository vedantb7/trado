"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSocket } from "@/hooks/useSocket";
import styles from "./page.module.css";

export default function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("buying");
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id;
  const { socket } = useSocket(userId, "dashboard") as any;

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const type = activeTab === "buying" ? "buying" : "selling";
      const res = await fetch(`/api/offers?type=${type}`);
      const data = await res.json();
      setOffers(data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, activeTab]);

  // Real-time Dashboard Updates
  useEffect(() => {
    if (socket) {
      socket.on("offer_received", (data: any) => {
        if (data.sellerId === userId && activeTab === "selling") {
          console.log("New offer received! Refreshing...");
          fetchData();
        }
      });

      socket.on("offer_status_changed", (data: any) => {
        // If I am either the buyer or seller of the affected offer
        fetchData();
      });

      return () => {
        socket.off("offer_received");
        socket.off("offer_status_changed");
      };
    }
  }, [socket, userId, activeTab]);

  if (!session) return <div>Loading session...</div>;

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Welcome, {session?.user?.name || "Trader"}</h1>
          <p>Karma Score: {(session?.user as any)?.karmaScore || 0}</p>
        </div>

        <div className={styles.tabs}>
          <button 
            className={activeTab === "buying" ? styles.activeTab : ""}
            onClick={() => setActiveTab("buying")}
          >
            Current Offers (Buying)
          </button>
          <button 
            className={activeTab === "selling" ? styles.activeTab : ""}
            onClick={() => setActiveTab("selling")}
          >
            My Items (Selling)
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.list}>
            {loading ? (
              <p>Loading your trades...</p>
            ) : offers.length > 0 ? (
              offers.map((offer: any) => (
                <div key={offer.id} className={styles.offerCard}>
                  <div className={styles.offerInfo}>
                    <h3>{offer.listing.title}</h3>
                    <p>Status: <span className={styles[offer.status.toLowerCase()]}>{offer.status}</span></p>
                    <p>Price: ₹{offer.priceOffered}</p>
                  </div>
                  <div className={styles.offerActions}>
                    <a href={`/offers/${offer.id}`} className={styles.viewBtn}>
                      View Trade
                    </a>
                    {activeTab === "selling" && (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          if (window.confirm("Delete this entire listing and all its offers?")) {
                            const res = await fetch(`/api/listings/${offer.listingId}`, { method: "DELETE" });
                            if (res.ok) fetchData();
                          }
                        }}
                        className={styles.deleteBtnSmall}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.cardPlaceholder}>
                <h3>No {activeTab} activity yet.</h3>
                <p>Explore the marketplace to start trading.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
