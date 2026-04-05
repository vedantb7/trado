"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function AdminOrders() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers", { cache: "no-store" });
      const data = await res.json();
      setOffers(data);
    } catch (err) {
      console.error("Admin error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const updateOffer = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/admin/offers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) fetchOffers();
    } catch (err) {
      alert("Update failed");
    }
  };

  const deleteOffer = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      if (res.ok) fetchOffers();
    } catch (err) {
      alert("Deletion failed");
    }
  };

  return (
    <div className={styles.adminPane}>
      <header className={styles.header}>
        <h2>Market Orders</h2>
        <button onClick={fetchOffers} className={styles.refreshBtn}>🔄 Refresh</button>
      </header>

      {loading ? (
        <div className={styles.loader}>Syncing with blockchain...</div>
      ) : offers.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Buyer</th>
                <th>Seller</th>
                <th>Bid Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td>
                    <Link href={`/listings/${offer.listing.id}`} className={styles.listingLink}>
                      {offer.listing.title}
                    </Link>
                  </td>
                  <td>{offer.buyer.name}</td>
                  <td>{offer.listing.seller.name}</td>
                  <td>
                    <input 
                      type="number" 
                      defaultValue={offer.priceOffered} 
                      onBlur={(e) => updateOffer(offer.id, { priceOffered: e.target.value })}
                      className={styles.priceInput}
                    />
                  </td>
                  <td>
                    <select 
                      value={offer.status} 
                      onChange={(e) => updateOffer(offer.id, { status: e.target.value })}
                      className={`${styles.statusSelect} ${styles[offer.status.toLowerCase()]}`}
                    >
                      <option value="Proposed">Proposed</option>
                      <option value="Countered">Countered</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className={styles.actions}>
                    <button 
                      onClick={() => deleteOffer(offer.id)} 
                      className={styles.deleteBtn}
                      title="Terminate Trade"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>No orders have been placed in the marketplace yet.</div>
      )}
    </div>
  );
}
