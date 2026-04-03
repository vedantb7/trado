"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function Dashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("buying");
  const [offers, setOffers] = useState([]);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    // Fetch user-specific items and offers
  }, [activeTab]);

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Your Dashboard</h1>
          <p>Manage your active trades and offers.</p>
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
            My Listings (Selling)
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.list}>
            {/* List items based on active tab */}
            <div className={styles.cardPlaceholder}>
              <h3>No {activeTab} activity yet.</h3>
              <p>Explore the marketplace to start trading.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
