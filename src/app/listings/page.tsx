"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ListingCard from "@/components/listings/ListingCard";
import { useSocket } from "@/hooks/useSocket";
import styles from "./page.module.css";

const CATEGORIES = ["Electronics", "Books", "Cycles", "HostelGear"];
const HOSTELS = ["Aibaan", "Beauki", "Chimair", "Duven", "Emiet", "Firpeal", "Griwiksh", "Hiqom", "Ijokha", "Jurqia", "Kyzeel"];

export default function ListingsPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("");

  const userId = (session?.user as any)?.id;
  const { socket } = useSocket(userId, "listings") as any;

  const fetchListings = useCallback(async (query = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedHostel) params.append("hostel", selectedHostel);
    if (query) params.append("q", query);

    const res = await fetch(`/api/listings?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    setListings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [selectedCategory, selectedHostel]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Live updates: new listing added
  useEffect(() => {
    if (!socket) return;
    const handleNewListing = (listing: any) => {
      // Only add if it matches current active filters
      if (selectedCategory && listing.category !== selectedCategory) return;
      if (selectedHostel && listing.locationHostel !== selectedHostel) return;
      setListings((prev) => {
        if (prev.find((l) => l.id === listing.id)) return prev;
        return [listing, ...prev];
      });
    };
    const handleListingUpdated = (data: any) => {
      // Remove listings that are no longer Available (sold/reserved)
      if (data.status && data.status !== "Available") {
        setListings((prev) => prev.filter((l) => l.id !== data.id));
      }
    };
    socket.on("listing_created", handleNewListing);
    socket.on("listing_updated", handleListingUpdated);
    return () => {
      socket.off("listing_created", handleNewListing);
      socket.off("listing_updated", handleListingUpdated);
    };
  }, [socket, selectedCategory, selectedHostel]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(search);
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <h4>Search Items</h4>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchBtn}>🔍</button>
            </form>
          </div>

          <div className={styles.filterGroup}>
            <h4>Category</h4>
            <div className={styles.pillGroup}>
              <button 
                className={`${styles.pill} ${!selectedCategory ? styles.active : ""}`}
                onClick={() => setSelectedCategory("")}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  className={`${styles.pill} ${selectedCategory === cat ? styles.active : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <h4>Pick-up Point (Hostel)</h4>
            <select 
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              className={styles.select}
            >
              <option value="">All Hostels</option>
              {HOSTELS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h2>Marketplace</h2>
            <p>{listings.length} items found</p>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading listings...</div>
          ) : listings.length > 0 ? (
            <div className={styles.grid}>
              {listings.map((l: any) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <h3>No items found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
