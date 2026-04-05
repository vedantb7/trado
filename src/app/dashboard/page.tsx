"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSocket } from "@/hooks/useSocket";
import styles from "./page.module.css";

export default function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("buying");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id;
  const { socket } = useSocket(userId, "dashboard") as any;

  const fetchData = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      let endpoint = "";
      if (activeTab === "buying") endpoint = "/api/offers?type=buying";
      else if (activeTab === "selling") endpoint = "/api/offers?type=selling";
      else if (activeTab === "watchlist") endpoint = "/api/bookmarks";

      const res = await fetch(endpoint, { cache: "no-store" });
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [session, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time Dashboard Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOffer = (payload: any) => {
      if (payload.sellerId === userId && activeTab === "selling") {
        fetchData();
      }
    };
    const handleStatusChange = () => fetchData();

    socket.on("offer_received", handleNewOffer);
    socket.on("offer_status_changed", handleStatusChange);
    socket.on("listing_created", handleStatusChange);

    return () => {
      socket.off("offer_received", handleNewOffer);
      socket.off("offer_status_changed", handleStatusChange);
      socket.off("listing_created", handleStatusChange);
    };
  }, [socket, userId, activeTab, fetchData]);

  if (!session) return <div>Loading...</div>;

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.userSection}>
            <h1>Active Hub</h1>
            <p className={styles.welcome}>Tracking your market activity, {session?.user?.name || "Trader"}</p>
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
            My Current Offers
          </button>
          <button 
            className={activeTab === "selling" ? styles.activeTab : ""}
            onClick={() => setActiveTab("selling")}
          >
            Items I’m Selling
          </button>
          <button 
            className={activeTab === "watchlist" ? styles.activeTab : ""}
            onClick={() => setActiveTab("watchlist")}
          >
            Watchlist
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.list}>
            {loading ? (
              <div className={styles.loader}>Synchronizing Hub...</div>
            ) : data.length > 0 ? (
              data.map((item: any) => {
                // Determine if it's an offer or a bookmark
                const isBookmark = activeTab === "watchlist";
                const listing = isBookmark ? item.listing : item.listing;
                const priceAtBookmark = isBookmark ? item.priceAtBookmark : null;
                const hasPriceDropped = isBookmark && priceAtBookmark && listing.price < priceAtBookmark;

                return (
                  <div key={item.id} className={styles.offerCard}>
                    <div className={styles.offerInfo}>
                      <div className={styles.titleRow}>
                        <h3>{listing.title}</h3>
                        {!isBookmark && (
                          <span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                            {item.status}
                          </span>
                        )}
                        {hasPriceDropped && (
                          <span className={styles.priceDropBadge}>
                            📉 Price Drop! Was ₹{priceAtBookmark}
                          </span>
                        )}
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.price}>
                          {isBookmark ? `Current Price: ₹${listing.price}` : `Active Bid: ₹${item.priceOffered}`}
                        </span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.category}>{listing.category}</span>
                      </div>
                    </div>
                    <div className={styles.offerActions}>
                      <Link 
                        href={isBookmark ? `/listings/${listing.id}` : `/offers/${item.id}`} 
                        className={styles.viewBtn}
                      >
                        {isBookmark ? "View Listing" : "Manage Trade"}
                      </Link>
                      {activeTab === "selling" && (
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            if (window.confirm("Archiving this listing will cancel all active negotiations. Continue?")) {
                              const res = await fetch(`/api/listings/${item.listingId}`, { method: "DELETE" });
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
                );
              })
            ) : (
              <div className={styles.cardPlaceholder}>
                <div className={styles.icon}>
                  {activeTab === "buying" ? "🤝" : activeTab === "selling" ? "📦" : "🔖"}
                </div>
                <h3>
                  {activeTab === "buying" ? "No Active Bids" : activeTab === "selling" ? "No Items for Sale" : "Watchlist Empty"}
                </h3>
                <p>
                  {activeTab === "watchlist" 
                    ? "Save items you're interested in to track price drops here." 
                    : "Start exploring the marketplace to see activity here."}
                </p>
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
