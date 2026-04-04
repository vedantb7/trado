import Link from "next/link";
import Image from "next/image";
import styles from "./ListingCard.module.css";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    images: string[];
    isUrgent: boolean;
    locationHostel: string;
    seller: {
      name: string;
      karmaScore: number;
    };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  // Optimization: Cloudinary auto-format and quality, plus fixed width for performance
  const displayImage = listing.images?.[0]
    ? listing.images[0].replace("/upload/", "/upload/c_scale,w_400,q_auto,f_auto/")
    : null;

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
        </div>
        
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.category}>{listing.category}</span>
            <span className={styles.hostel}>{listing.locationHostel}</span>
          </div>
          
          <h3 className={styles.title}>{listing.title}</h3>
          <p className={styles.price}>₹{listing.price}</p>
          
          <div className={styles.footer}>
            <div className={styles.sellerInfo}>
              <span className={styles.sellerName}>{listing.seller.name}</span>
              <span className={styles.karma}>⭐ {listing.seller.karmaScore}</span>
            </div>
            <button className={styles.viewBtn} aria-hidden="true">View Deal</button>
          </div>
        </div>
      </div>
    </Link>
  );
}
