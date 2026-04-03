import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <Navbar />
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
              <button className="btn-primary">Browse Listings</button>
              <button className={styles.secondaryBtn}>How it works</button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            {/* Visual representation of the app's connectivity */}
            <div className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar} />
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

        <section className={styles.features}>
          <div className={styles.feature}>
            <h3>Verified @iitgn</h3>
            <p>Exclusive access for the IITGN community with Google OAuth.</p>
          </div>
          <div className={styles.feature}>
            <h3>Handshake Deals</h3>
            <p>Smart pickup points like Aiyana Mess for secure real-world trades.</p>
          </div>
          <div className={styles.feature}>
            <h3>Trust System</h3>
            <p>Karma scores based on your trading history and peer reviews.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
