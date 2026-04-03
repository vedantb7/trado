"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

const CATEGORIES = ["Electronics", "Books", "Cycles", "HostelGear"];
const HOSTELS = ["Aiyana", "Beauki", "Chimair", "Duari", "Ekaant", "Falgun", "Gagan", "Hridaya", "Indu", "Jasubai"];

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "Electronics",
    locationHostel: "Aiyana",
    isUrgent: false,
    images: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
      }),
    });

    if (res.ok) {
      router.push("/listings");
    } else {
      alert("Failed to create listing");
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Post a New Listing</h1>
            <p>Reach verified buyers across the IITGN campus.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
              <h3>Product Details</h3>
              <div className={styles.field}>
                <label>Item Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. MacBook Pro M1 2020"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className={styles.field}>
                <label>Description</label>
                <textarea 
                  required 
                  placeholder="Describe condition, warranty, etc."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div className={styles.field}>
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Logistics & Urgency</h3>
              <div className={styles.field}>
                <label>Pick-up Point (Hostel)</label>
                <select 
                  value={formData.locationHostel}
                  onChange={e => setFormData({...formData, locationHostel: e.target.value})}
                >
                  {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className={styles.checkboxField}>
                <input 
                  type="checkbox" 
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onChange={e => setFormData({...formData, isUrgent: e.target.checked})}
                />
                <label htmlFor="isUrgent">Mark as Urgent Sale (Graduating soon?)</label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Posting..." : "Create Listing"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
