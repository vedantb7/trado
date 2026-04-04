"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import styles from "./page.module.css";

export default function ListingDetail() {
  const { id } = useParams() as any;
  const router = useRouter();
  const { data: session } = useSession();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchListing() {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) {
        setListing(await res.json());
      }
      setLoading(false);
    }
    fetchListing();
  }, [id]);

  const { isConnected, socket } = useSocket(
    (session?.user as any)?.id, 
    "listings"
  ) as any;

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          priceOffered: parseFloat(offerPrice),
        }),
      });

      if (res.ok) {
        const offer = await res.json();
        
        // Notify the seller via socket
        if (isConnected && socket) {
          socket.emit("new_offer", { 
            sellerId: listing.sellerId, 
            offerId: offer.id 
          });
        }

        router.push(`/offers/${offer.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to make offer");
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loader}>Loading item details...</div>;
  if (!listing) return <div className={styles.error}>Listing not found</div>;

  const isOwner = session?.user && (session.user as any).id === listing.sellerId;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing? This will also cancel all active offers.")) return;
    
    const res = await fetch(`/api/listings/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Failed to delete listing");
    }
  };

  const renderOwnerNotice = () => (
    <div className={styles.ownerNotice}>
      <p>This is your listing. Check the dashboard to see active offers.</p>
      <div className={styles.ownerActions}>
        <button onClick={() => router.push("/dashboard")} className="btn-secondary">
            Go to Dashboard
        </button>
        <button onClick={handleDelete} className={styles.deleteBtn}>
            Delete Listing
        </button>
      </div>
    </div>
  );

  const renderActionCard = () => {
    if (isOwner) return renderOwnerNotice();
    
    return (
      <form onSubmit={handleMakeOffer} className={styles.offerForm}>
        <h3>Interested?</h3>
        <p>Make an offer to start a chat with the seller.</p>
        <div className={styles.inputGroup}>
          <input 
            type="number" 
            required 
            placeholder="Your price"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
          />
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Sending..." : "Make Offer"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.contentLayout}>
            <div className={styles.mediaSection}>
              {listing.images?.[0] ? (
                <div className={styles.mainImage}>
                   <Image 
                     src={listing.images[0]} 
                     alt={listing.title} 
                     fill 
                     className={styles.img}
                   />
                </div>
              ) : (
                <div className={styles.noImage}>No Image Available</div>
              )}
              {listing.isUrgent && (
                <div className={styles.urgentTag}>⚠️ Urgent Sale</div>
              )}
            </div>

            <div className={styles.infoSection}>
              <div className={styles.header}>
                <span className={styles.category}>{listing.category}</span>
                <h1>{listing.title}</h1>
                <h2 className={styles.price}>₹{listing.price}</h2>
              </div>

              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Location:</span>
                  <span className={styles.value}>{listing.locationHostel} Hostel</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Description:</span>
                  <p className={styles.description}>{listing.description}</p>
                </div>
              </div>

              <div className={styles.sellerCard}>
                <h3>Seller Information</h3>
                <div className={styles.sellerInfo}>
                  <div className={styles.sellerHeader}>
                    <strong>{listing.seller.name}</strong>
                    <span className={styles.karma}>⭐ {listing.seller.karmaScore} Karma</span>
                  </div>
                  <p>Verified IITGN Resident</p>
                </div>
              </div>

              <div className={styles.actionCard}>
                {renderActionCard()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
