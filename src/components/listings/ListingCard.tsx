import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    images: string[];
    isUrgent: boolean;
    locationHostel: string | null;
    seller: {
      name: string | null;
      karmaScore: number;
    } | null;
  };
  initialBookmarked?: boolean;
}

export default function ListingCard({ listing, initialBookmarked = false }: ListingCardProps) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  // Optimization: Cloudinary auto-format and quality, plus fixed width for performance
  const displayImage = listing.images?.[0]
    ? listing.images[0].replace("/upload/", "/upload/c_scale,w_400,q_auto,f_auto/")
    : null;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      alert("Please login to bookmark items.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsBookmarked(data.bookmarked);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link 
      href={`/listings/${listing.id}`} 
      className={styles.cardLink}
      aria-label={`View deal for ${listing.title} listed for ${listing.price} rupees`}
    >
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          {displayImage ? (
            <Image 
              src={displayImage} 
              alt={listing.title} 
              fill 
              className={styles.image}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className={styles.placeholder}>No Image</div>
          )}
          {listing.isUrgent && <div className={styles.urgentBadge}>Urgent</div>}
          
          <button 
            className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ""}`}
            onClick={handleBookmark}
            disabled={loading}
            title={isBookmarked ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {isBookmarked ? "❤️" : "🤍"}
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.category}>{listing.category}</span>
            <span className={styles.hostel}>{listing.locationHostel ?? "—"}</span>
          </div>
          
          <h3 className={styles.title}>{listing.title}</h3>
          <p className={styles.price}>₹{listing.price}</p>
          
          <div className={styles.footer}>
            <div className={styles.sellerInfo}>
              <span className={styles.sellerName}>
                {listing.seller?.name ?? "Seller unavailable"}
              </span>
              <span className={styles.karma}>⭐ {listing.seller?.karmaScore ?? "—"}</span>
            </div>
            <button className={styles.viewBtn} aria-hidden="true">View Deal</button>
          </div>
        </div>
      </div>
    </Link>
  );
}
