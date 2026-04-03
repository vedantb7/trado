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
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {listing.images?.[0] ? (
          <Image 
            src={listing.images[0]} 
            alt={listing.title} 
            fill 
            className={styles.image}
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
          <button className={styles.viewBtn}>View Deal</button>
        </div>
      </div>
    </div>
  );
}
