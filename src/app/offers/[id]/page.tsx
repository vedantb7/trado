"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatRoom from "@/components/chat/ChatRoom";
import { useSocket } from "@/hooks/useSocket";
import styles from "./page.module.css";

export default function NegotiationPage() {
  const { id: offerId } = useParams() as any;
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [handshakeInput, setHandshakeInput] = useState("");
  const [handshakeCode, setHandshakeCode] = useState<string | null>(null);

  const { isConnected, emitOfferUpdate, socket } = useSocket(
    (session?.user as any)?.id, 
    offer?.room?.id
  ) as any;

  useEffect(() => {
    const fetchOffer = async () => {
      const res = await fetch(`/api/offers/${offerId}`);
      if (res.ok) {
        const data = await res.json();
        setOffer(data);
      }
      setLoading(false);
    };
    fetchOffer();
  }, [offerId]);

  // Handle real-time offer updates from the other party
  useEffect(() => {
    if (socket) {
      const handleOfferUpdate = (data: any) => {
        if (data.offerId === offerId) {
          // If the socket message contains the full updated offer, use it directly
          if (data.updatedOffer) {
            setOffer(data.updatedOffer);
            return;
          }

          // Fallback to re-fetch if object is missing (consistent with other components)
          const fetchOffer = async () => {
            const res = await fetch(`/api/offers/${offerId}`, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              setOffer(data);
            }
          };
          fetchOffer();
        }
      };
      socket.on("offer_status_changed", handleOfferUpdate);
      return () => {
        socket.off("offer_status_changed", handleOfferUpdate);
      };
    }
  }, [socket, offerId]);

  const updateStatus = async (status: string, price?: number, code?: string) => {
    if (submitting) return;

    // Validate counter price if any
    if (status === "Countered" && (!price || isNaN(price))) {
      alert("Please enter a valid price to counter.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priceCountered: price, handshakeCode: code }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOffer(updated);
        // Notify the other party with the full updated object
        if (isConnected) {
          emitOfferUpdate(offerId as string, status, { updatedOffer: updated });
        }
      } else {
        const err = await res.json().catch(() => ({ error: "Update failed" }));
        alert(err.error || "Failed to update offer");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateHandshake = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/handshake`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setHandshakeCode(data.handshakeCode);
        // Re-fetch offer to sync state
        const res2 = await fetch(`/api/offers/${offerId}`);
        if (res2.ok) setOffer(await res2.json());
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Wait for BOTH offer data AND session to be ready
  if (loading || sessionStatus === "loading") {
    return <div className={styles.loader}>Synchronizing negotiation data...</div>;
  }

  if (!offer) return <div className={styles.error}>Offer not found</div>;

  const currentUserId = (session?.user as any)?.id;
  const isSeller = offer.listing?.sellerId === currentUserId;
  const isBuyer = offer.buyerId === currentUserId;

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.negotiationHeader}>
          <div className={styles.listingSummary}>
            <span className={styles.category}>{offer.listing.category}</span>
            <h1>{offer.listing.title}</h1>
            <div className={styles.statusRow}>
              <span className={styles.statusBadge}>{offer.status}</span>
              <span className={styles.lastUpdate}>Updated {new Date(offer.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className={styles.priceInfo}>
            <span>Active Negotiation Price</span>
            <h3>₹{offer.priceOffered}</h3>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.chatSection}>
            <div className={styles.chatHeader}>
              🛡️ Verified Negotiation Channel
            </div>
            <ChatRoom 
              roomId={offer.room?.id} 
              buyerName={offer.buyer?.name} 
              sellerName={offer.listing?.seller?.name} 
            />
          </div>

          <div className={styles.controlsSection}>
            <div className={styles.card}>
              <h3>Trade Controls</h3>
              <p>Execute actions to progress the deal.</p>

              <div className={styles.actions}>
                {/* Negotiation Phase: Proposed or Countered */}
                {(offer.status === "Proposed" || offer.status === "Countered") && (
                  <div className={styles.negotiationPanel}>
                    {/* Show Accept button only if the other party proposed the current price */}
                    {offer.lastPriceBy !== currentUserId && (
                      <button 
                        onClick={() => updateStatus("Accepted")} 
                        disabled={submitting}
                        className={styles.acceptBtn}
                      >
                        {submitting ? "Processing..." : "Accept Current Price"}
                      </button>
                    )}
                    
                    <div className={styles.counterArea}>
                      <div className={styles.inputWrapper}>
                        <span className={styles.currency}>₹</span>
                        <input 
                          type="number" 
                          placeholder="Your counter..." 
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={() => updateStatus("Countered", parseFloat(counterPrice))}
                        disabled={submitting}
                        className={styles.counterBtn}
                      >
                        {submitting ? "..." : "Counter Offer"}
                      </button>
                    </div>
                    
                    <p className={styles.turnIndicator}>
                      {offer.lastPriceBy === currentUserId 
                        ? "Waiting for other party to respond..." 
                        : "It's your turn to respond"}
                    </p>
                  </div>
                )}

                {/* Handshake Phase: Accepted */}
                {offer.status === "Accepted" && (
                  <div className={styles.handshakeBox}>
                    {isSeller ? (
                      <div className={styles.sellerHandshake}>
                        <button 
                          onClick={handleGenerateHandshake} 
                          disabled={submitting}
                          className={styles.acceptBtn}
                        >
                          {submitting ? "Generating..." : "Generate Handshake Code"}
                        </button>
                        {(handshakeCode || offer.handshakeCode) && (
                          <div className={styles.codeDisplay}>
                            <span>Share this with the buyer at meeting:</span>
                            <h2>{handshakeCode || offer.handshakeCode}</h2>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.buyerHandshake}>
                        <p>Awaiting handshake code from seller...</p>
                        <div className={styles.counterArea}>
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit code" 
                            value={handshakeInput}
                            onChange={(e) => setHandshakeInput(e.target.value)}
                          />
                          <button 
                            onClick={() => updateStatus("Completed", undefined, handshakeInput)}
                            disabled={submitting}
                            className={styles.counterBtn}
                          >
                            Verify & Close Deal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {offer.status === "Completed" && (
                  <div className={styles.completedBox}>
                    <div className={styles.successIcon}>✨</div>
                    <h3>Transaction Complete</h3>
                    <p>Karma points have been synchronized to your profiles.</p>
                    <button onClick={() => router.push("/dashboard")} className={styles.counterBtn}>
                        Back to Control Center
                    </button>
                  </div>
                )}

                {offer.status !== "Completed" && offer.status !== "Declined" && (
                  <button 
                    onClick={() => updateStatus("Declined")} 
                    disabled={submitting}
                    className={styles.declineBtn}
                  >
                    {isBuyer ? "Withdraw" : "Decline Negotiation"}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.safetyCard}>
              <h4>🛡️ Trade Securely</h4>
              <p>Meet in daylight at campus landmarks. Do not share the handshake code until the item is in your hands.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
