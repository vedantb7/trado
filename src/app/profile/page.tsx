"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ListingCard from "@/components/listings/ListingCard";
import styles from "./page.module.css";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeListings, setActiveListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/listings?sellerEmail=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setActiveListings(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Profile listings error:", err);
          setLoading(false);
        });
    }
  }, [status, session]);

  if (status === "loading") return <div className={styles.loader}>Loading identity...</div>;
  if (status === "unauthenticated") return <div className={styles.error}>Unauthorized. Please login.</div>;

  const user = session?.user as any;

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            {user?.image ? (
              <Image src={user.image} alt={user.name} width={120} height={120} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{user?.name?.charAt(0) || "U"}</div>
            )}
            <div className={styles.karmaBadge}>⭐ {user.karmaScore || 0} Karma</div>
          </div>
          
          <div className={styles.identity}>
            <h1>{user?.name}</h1>
            <p className={styles.email}>{user?.email}</p>
            <div className={styles.roles}>
              {user?.roles?.map((role: string) => (
                <span key={role} className={styles.roleTag}>{role}</span>
              ))}
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Manage Your Table</h2>
            <p>You have {activeListings.length} active items in the marketplace.</p>
          </div>

          {loading ? (
            <div className={styles.loader}>Syncing your items...</div>
          ) : activeListings.length > 0 ? (
            <div className={styles.listingsGrid}>
              {activeListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Your shop is currently empty.</p>
              <a href="/sell" className="btn-primary">List an Item</a>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
