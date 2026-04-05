import Link from "next/link";
import styles from "./HomeHero.module.css";

export default function HomeHero() {
  const scrollToFeatures = () => {
    const features = document.getElementById("features");
    features?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>IITGN Student Council Special</div>
          <h1 className={styles.title}>
            The Smartest Way to <br />
            <span>Trade at IITGN.</span>
          </h1>
          <p className={styles.subtitle}>
            No more messy WhatsApp groups. Buy and sell electronics, 
            books, and hostel gear with verified peers.
          </p>
          <div className={styles.cta}>
            <Link href="/listings" className="btn-primary">
              Browse Listings
            </Link>
            <button onClick={scrollToFeatures} className={styles.secondaryBtn}>
              How it works
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <div className={styles.image} />
              <div className={styles.userDetails}>
                <div className={styles.userName}>Vivek Raj</div>
                <div className={styles.userKarma}>⭐ 4.9 Karma</div>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.priceTag}>₹450</div>
              <p>Selling: Concepts of Physics (HCV)</p>
            </div>
            <div className={styles.cardStatus}>Reserved</div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.feature}>
          <h3>Verified @iitgn</h3>
          <p>Exclusive access for the IITGN community — sign in with your institute email.</p>
        </div>
        <div className={styles.feature}>
          <h3>Handshake Deals</h3>
          <p>Smart pickup points like Aibaan Mess for secure real-world trades.</p>
        </div>
        <div className={styles.feature}>
          <h3>Trust System</h3>
          <p>Karma scores based on your trading history and peer reviews.</p>
        </div>
      </section>
    </main>
  );
}
