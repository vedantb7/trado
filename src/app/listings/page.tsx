"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ListingCard from "@/components/listings/ListingCard";
import styles from "./page.module.css";

const CATEGORIES = ["Electronics", "Books", "Cycles", "HostelGear"];
const HOSTELS = ["Aiyana", "Beauki", "Chimair", "Duari", "Ekaant", "Falgun", "Gagan", "Hridaya", "Indu", "Jasubai"];

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("");

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedHostel]);

  const fetchListings = async (query = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedHostel) params.append("hostel", selectedHostel);
    if (query) params.append("q", query);

    const res = await fetch(`/api/listings?${params.toString()}`);
    const data = await res.json();
    setListings(data);
    setLoading(false);
  };

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
