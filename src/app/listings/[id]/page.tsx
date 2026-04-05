"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { useSocket } from "@/hooks/useSocket";
import ChatRoom from "@/components/chat/ChatRoom";
import styles from "./page.module.css";

export default function ListingDetail() {
  const { id } = useParams() as any;
  const router = useRouter();
  const { data: session } = useSession();
  
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offerPrice, setOfferPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);

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

  // Real-time listener for offers and status updates on this listing
  useEffect(() => {
    if (socket && listing) {
      const refreshListing = (data: any) => {
        // Only refresh if the event is relevant to this listing
        if (data.listingId === id || data.roomId) {
          fetch(`/api/listings/${id}`).then(res => res.json()).then(setListing);
        }
      };

      socket.on("offer_received", refreshListing);
      socket.on("offer_status_changed", refreshListing);

      return () => {
        socket.off("offer_received", refreshListing);
        socket.off("offer_status_changed", refreshListing);
      };
    }
  }, [socket, listing, id]);

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
        if (isConnected && socket) {
          socket.emit("new_offer", { sellerId: listing.sellerId, offerId: offer.id, listingId: id });
        }
        router.push(`/offers/${offer.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to make offer");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Something went wrong");
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loader}>Loading item details...</div>;
  if (!listing) return <div className={styles.error}>Listing not found</div>;

  const isOwner = session?.user && (session.user as any).id === listing.sellerId;
  const activeOffer = listing.offers?.find((o: any) => o.id === activeOfferId);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will delete the listing and all its offers.")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  };

  const handleFlag = async () => {
    if (!session) {
      alert("You must be logged in to report listings.");
      return;
    }
    const reason = prompt("Why are you reporting this listing? (e.g. Spam, Counterfeit, Offensive)");
    if (!reason) return;

    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "listing", targetId: id, reason })
      });
      if (res.ok) {
        alert("Report submitted successfully. Our moderators will review it.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit report.");
      }
    } catch (e) {
      alert("Network error.");
    }
  };

  const handleUpdateStatus = async (offerId: string, status: string) => {
    if (!window.confirm(`Are you sure you want to mark this offer as ${status}?`)) return;

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updatedOffer = await res.json();
        // Update local listing state to reflect the status change
        setListing((prev: any) => ({
          ...prev,
          offers: prev.offers.map((o: any) => o.id === offerId ? updatedOffer : o),
          status: status === "Accepted" ? "Reserved" : prev.status
        }));
        
        // Notify socket
        if (socket && isConnected) {
          socket.emit("offer_updated", { offerId, status, roomId: updatedOffer.room?.id });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const renderNegotiationHub = () => (
    <div className={styles.negotiationHub}>
      <h3 className={styles.hubTitle}>Active Negotiations ({listing.offers?.filter((o: any) => o.status !== 'Declined').length || 0})</h3>
      <div className={styles.hubLayout}>
        <div className={styles.offersSidebar}>
          {listing.offers?.map((offer: any) => (
            <button 
              key={offer.id} 
              onClick={() => setActiveOfferId(offer.id)}
              className={`${styles.offerCard} ${activeOfferId === offer.id ? styles.active : ""} ${offer.status === 'Declined' ? styles.declinedCard : ""}`}
            >
              <div className={styles.offerHead}>
                <span className={styles.buyerName}>{offer.buyer.name}</span>
                <span className={styles.priceTag}>₹{offer.priceOffered}</span>
              </div>
              <span className={styles.offerStatus}>{offer.status}</span>
            </button>
          ))}
          {(!listing.offers || listing.offers.length === 0) && (
            <p className={styles.emptyMsg}>No offers yet. Buyers will appear here when they bid.</p>
          )}
        </div>
        
        <div className={styles.chatWindow}>
          {activeOffer ? (
            <div className={styles.activeChat}>
              <div className={styles.chatHeader}>
                <div className={styles.chatTitle}>
                  Negotiating with {activeOffer.buyer.name}
                  <span className={`${styles.statusBadge} ${styles[activeOffer.status.toLowerCase()]}`}>
                    {activeOffer.status}
                  </span>
                </div>
                
                {activeOffer.status === "Proposed" && (
                  <div className={styles.sellerActions}>
                    <button 
                      onClick={() => handleUpdateStatus(activeOffer.id, "Accepted")}
                      className={styles.acceptBtn}
                    >
                      Accept offer
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(activeOffer.id, "Declined")}
                      className={styles.declineBtn}
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                <Link href={`/offers/${activeOffer.id}`} className={styles.fullViewLink}>
                  Full View ↗
                </Link>
              </div>
              <ChatRoom 
                roomId={activeOffer.room?.id} 
                buyerName={activeOffer.buyer.name} 
                sellerName={listing.seller.name} 
                isLocked={activeOffer.status === "Completed" || activeOffer.status === "Declined"}
              />
            </div>
          ) : (
            <div className={styles.chatPlaceholder}>
              <div className={styles.icon}>💬</div>
              <p>Select a buyer to start negotiating</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.contentLayout}>
            {/* Left: Media & Details */}
            <div className={styles.leftCol}>
              <div className={styles.mediaSection}>
                {listing.images?.[0] ? (
                  <div className={styles.mainImage}>
                    <Image src={listing.images[0]} alt={listing.title} fill className={styles.img} />
                    {listing.isUrgent && <div className={styles.urgentTag}>⚠️ Urgent</div>}
                  </div>
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
              </div>
              
              <div className={styles.detailsGroup}>
                <div className={styles.priceRow}>
                  <h2 className={styles.price}>₹{listing.price}</h2>
                  <span className={styles.category}>{listing.category}</span>
                </div>
                <h1>{listing.title}</h1>
                <p className={styles.description}>{listing.description}</p>
                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <label>📍 Hostel Location</label>
                    <span>{listing.locationHostel} Hostel</span>
                  </div>
                  <div className={styles.metaItem}>
                    <label>👤 Trusted Seller</label>
                    <span>{listing.seller.name} (⭐ {listing.seller.karmaScore})</span>
                  </div>
                </div>
                
                {!isOwner && (
                  <button 
                    onClick={handleFlag}
                    className={styles.reportBtn}
                    title="Report Suspicious Listing"
                  >
                    🚩 Report this listing
                  </button>
                )}
              </div>
            </div>

            {/* Right: Actions or Hub */}
            <div className={styles.rightCol}>
              {isOwner ? (
                <div className={styles.ownerControls}>
                  <div className={styles.ownerBanner}>
                    <span>🛡️ Listing Management</span>
                    <button onClick={handleDelete} className={styles.deleteBtn}>Delete Listing</button>
                  </div>
                  {renderNegotiationHub()}
                </div>
              ) : (
                <div className={styles.actionCard}>
                  <div className={styles.cardHeader}>
                    <h3>Interested?</h3>
                    <p>Propose your best price to start a direct negotiation with the seller.</p>
                  </div>
                  <form onSubmit={handleMakeOffer} className={styles.offerForm}>
                    <div className={styles.inputGroup}>
                      <span className={styles.currency}>₹</span>
                      <input 
                        type="number" 
                        required 
                        placeholder="0.00"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                      />
                    </div>
                    <button type="submit" disabled={submitting} className={styles.submitBtn}>
                      {submitting ? "Sending Your Bid..." : "Make An Offer"}
                    </button>
                  </form>
                  <div className={styles.trustBanner}>
                    🔒 Secure Handshake • ✅ Verified IITGN ID
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
