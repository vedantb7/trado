"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
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
        fetchData();
      });

      return () => {
        socket.off("offer_received");
        socket.off("offer_status_changed");
      };
    }
  }, [socket, userId, activeTab]);

  if (!session) return <div>Loading...</div>;

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.userSection}>
            <h1>Control Center</h1>
            <p className={styles.welcome}>Welcome back, {session?.user?.name || "Trader"}</p>
          </div>
          <div className={styles.karmaScore}>
            💎 { (session?.user as any)?.karmaScore || 0 } Karma
          </div>
        </div>

        <div className={styles.tabs}>
          <button 
            className={activeTab === "buying" ? styles.activeTab : ""}
            onClick={() => setActiveTab("buying")}
          >
            My Bids
          </button>
          <button 
            className={activeTab === "selling" ? styles.activeTab : ""}
            onClick={() => setActiveTab("selling")}
          >
            My Listings
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.list}>
            {loading ? (
              <div className={styles.loader}>Synchronizing your updates...</div>
            ) : offers.length > 0 ? (
              offers.map((offer: any) => (
                <div key={offer.id} className={styles.offerCard}>
                  <div className={styles.offerInfo}>
                    <div className={styles.titleRow}>
                      <h3>{offer.listing.title}</h3>
                      <span className={`${styles.status} ${styles[offer.status.toLowerCase()]}`}>
                        {offer.status}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.price}>Active Bid: ₹{offer.priceOffered}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.category}>{offer.listing.category}</span>
                    </div>
                  </div>
                  <div className={styles.offerActions}>
                    <Link href={`/offers/${offer.id}`} className={styles.viewBtn}>
                      Manage Trade
                    </Link>
                    {activeTab === "selling" && (
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          if (window.confirm("Archiving this listing will cancel all active negotiations. Continue?")) {
                            const res = await fetch(`/api/listings/${offer.listingId}`, { method: "DELETE" });
                            if (res.ok) fetchData();
                          }
                        }}
                        className={styles.deleteBtnSmall}
                        title="Delete Listing"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.cardPlaceholder}>
                <div className={styles.icon}>🏙️</div>
                <h3>Quiet Market...</h3>
                <p>Start a new transition to see it appear here in your command center.</p>
                <Link href="/listings" className="btn-primary" style={{ marginTop: '1.5rem' }}>
                    Browse Marketplace
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
