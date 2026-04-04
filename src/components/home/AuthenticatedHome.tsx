"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ListingCard from "@/components/listings/ListingCard";
import styles from "./AuthenticatedHome.module.css";

interface AuthenticatedHomeProps {
  user: any;
}

export default function AuthenticatedHome({ user }: AuthenticatedHomeProps) {
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/listings?limit=5");
        const data = await res.json();
        setRecentListings(data);
      } catch (err) {
        console.error("Failed to fetch listings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, []);

  const CATEGORIES = [
    { name: "Electronics", icon: "💻" },
    { name: "Books", icon: "📚" },
    { name: "Cycles", icon: "🚲" },
    { name: "Hostel Gear", icon: "🛋️" },
    { name: "Sports", icon: "⚽" },
    { name: "Clothing", icon: "👕" },
  ];

  return (
    <div className={styles.container}>
      <section className={styles.welcomeSection}>
        <div className={styles.greeting}>
          <h1>Welcome back, {user.name?.split(" ")[0]}! 👋</h1>
          <p>Ready to find your next deal at IITGN?</p>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Your Karma</span>
            <span className={styles.statValue}>⭐ {user.karmaScore || 0}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Offers</span>
            <span className={styles.statValue}>0</span>
          </div>
        </div>
      </section>

      <section className={styles.quickActions}>
        <Link href="/sell" className={`${styles.actionButton} ${styles.sellAction}`}>
          <span>➕</span> Sell an Item
        </Link>
        <Link href="/dashboard?tab=buying" className={`${styles.actionButton} ${styles.offersAction}`}>
          <span>📬</span> My Offers
        </Link>
        <Link href="/dashboard?tab=selling" className={`${styles.actionButton} ${styles.savedAction}`}>
          <span>📦</span> My Listings
        </Link>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Browse Categories</h2>
        </div>
        <div className={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Link href={`/listings?category=${cat.name}`} key={cat.name} className={styles.categoryCard}>
              <span className={styles.categoryIcon}>{cat.icon}</span>
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Freshly Added</h2>
          <Link href="/listings" className={styles.viewAll}>View all listings →</Link>
        </div>
        
        {loading ? (
          <div>Loading awesome deals...</div>
        ) : recentListings.length > 0 ? (
          <div className={styles.carousel}>
            {recentListings.map((listing: any) => (
              <div key={listing.id} className={styles.carouselItem}>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card" style={{textAlign: 'center', padding: '3rem'}}>
             <p style={{fontSize: '3rem', marginBottom: '1rem'}}>🏢</p>
             <h3>No recent listings found.</h3>
             <p style={{color: 'var(--muted)'}}>Be the first to list something in your hostel!</p>
             <Link href="/sell" className="btn-primary" style={{marginTop: '1.5rem'}}>Sell Something</Link>
          </div>
        )}
      </section>
    </div>
  );
}
