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
  const { data: session } = useSession();
  const router = useRouter();
  
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
          // Re-fetch to get latest state including potential handshake codes
          const fetchOffer = async () => {
            const res = await fetch(`/api/offers/${offerId}`);
            if (res.ok) {
              const data = await res.json();
              setOffer(data);
            }
          };
          fetchOffer();
        }
      };
      socket.on("offer_updated", handleOfferUpdate);
      return () => {
        socket.off("offer_updated", handleOfferUpdate);
      };
    }
  }, [socket, offerId]);

  const updateStatus = async (status: string, price?: number, code?: string) => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priceCountered: price, handshakeCode: code }),
    });

    if (res.ok) {
      const updated = await res.json();
      setOffer(updated);
      // Notify the other party
      if (isConnected) {
        emitOfferUpdate(offerId as string, status);
      }
    }
  };

  const handleGenerateHandshake = async () => {
    const res = await fetch(`/api/offers/${offerId}/handshake`, {
      method: "PATCH",
    });
    if (res.ok) {
      const data = await res.json();
      setHandshakeCode(data.handshakeCode);
    }
  };

  if (loading) return <div className={styles.loader}>Loading negotiation...</div>;
  if (!offer) return <div className={styles.error}>Offer not found</div>;

  const isSeller = offer.listing.sellerId === (session?.user as any).id;
  const isBuyer = offer.buyerId === (session?.user as any).id;

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
                {offer.status === "Proposed" && isSeller && (
                  <div className={styles.sellerActions}>
                    <button 
                      onClick={() => updateStatus("Accepted")} 
                      className={styles.acceptBtn}
                    >
                      Accept Proposal
                    </button>
                    <div className={styles.counterArea}>
                      <input 
                        type="number" 
                        placeholder="State your counter..." 
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                      />
                      <button 
                        onClick={() => updateStatus("Countered", parseFloat(counterPrice))}
                        className={styles.counterBtn}
                      >
                        Counter Offer
                      </button>
                    </div>
                  </div>
                )}

                {offer.status === "Accepted" && (
                  <div className={styles.handshakeBox}>
                    {isSeller ? (
                      <div className={styles.sellerHandshake}>
                        <button 
                          onClick={handleGenerateHandshake} 
                          className={styles.acceptBtn}
                        >
                          Generate Handshake Code
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

                {offer.status !== "Completed" && (
                  <button 
                    onClick={() => updateStatus("Declined")} 
                    className={styles.declineBtn}
                  >
                    Withdraw from Trade
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
