"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatRoom from "@/components/chat/ChatRoom";
import { generateHandshakeCode, verifyHandshake } from "@/lib/handshake";
import styles from "./page.module.css";

export default function NegotiationPage() {
  const { id: offerId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counterPrice, setCounterPrice] = useState("");
  const [handshakeInput, setHandshakeInput] = useState("");
  const [handshakeCode, setHandshakeCode] = useState<string | null>(null);

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

  const updateStatus = async (status: string, price?: number) => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priceCountered: price }),
    });

    if (res.ok) {
      const updated = await res.json();
      setOffer(updated);
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
            <h1>{offer.listing.title}</h1>
            <p className={styles.statusBadge}>{offer.status}</p>
          </div>
          <div className={styles.priceInfo}>
            <span>Active Offer:</span>
            <h3>₹{offer.priceOffered}</h3>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.chatSection}>
            <ChatRoom 
              roomId={offer.room?.id} 
              buyerName={offer.buyer?.name} 
              sellerName={offer.listing?.seller?.name} 
            />
          </div>

          <div className={styles.controlsSection}>
            <div className={styles.card}>
              <h3>Offer Controls</h3>
              <p>Manage the state of this deal.</p>

              <div className={styles.actions}>
                {offer.status === "Proposed" && isSeller && (
                  <>
                    <button 
                      onClick={() => updateStatus("Accepted")} 
                      className={styles.acceptBtn}
                    >
                      Accept Deal
                    </button>
                    <div className={styles.counterArea}>
                      <input 
                        type="number" 
                        placeholder="Counter price" 
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                      />
                      <button 
                        onClick={() => updateStatus("Countered", parseFloat(counterPrice))}
                        className={styles.counterBtn}
                      >
                        Counter
                      </button>
                    </div>
                  </>
                )}

                {offer.status === "Accepted" && (
                  <div className={styles.handshakeBox}>
                    {isSeller ? (
                      <>
                        <button 
                          onClick={() => setHandshakeCode(generateHandshakeCode())} 
                          className={styles.acceptBtn}
                        >
                          Generate Handshake Code
                        </button>
                        {handshakeCode && (
                          <div className={styles.codeDisplay}>
                            <span>Share this with the buyer:</span>
                            <h2>{handshakeCode}</h2>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={styles.counterArea}>
                        <input 
                          type="text" 
                          placeholder="Enter handshake code" 
                          value={handshakeInput}
                          onChange={(e) => setHandshakeInput(e.target.value)}
                        />
                        <button 
                          onClick={() => updateStatus("Completed")}
                          className={styles.counterBtn}
                        >
                          Verify
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {offer.status === "Completed" && (
                  <div className={styles.completedBox}>
                    <h3>🤝 Deal Completed!</h3>
                    <p>Karma points awarded to both parties.</p>
                  </div>
                )}

                {offer.status !== "Completed" && (
                  <button 
                    onClick={() => updateStatus("Declined")} 
                    className={styles.declineBtn}
                  >
                    Decline Deal
                  </button>
                )}
              </div>
            </div>

            <div className={styles.safetyCard}>
              <h4>IITGN Safety Tip</h4>
              <p>Use designated pickup points (e.g. Aiyana Mess). Always verify the item condition before completing the handshake.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
