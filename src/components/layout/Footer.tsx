import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.info}>
          <h3>Trado@IITGN</h3>
          <p>The premium community exchange for IIT Gandhinagar students and staff.</p>
        </div>
        <div className={styles.links}>
          <h4>Categories</h4>
          <ul>
            <li>Electronics</li>
            <li>Books</li>
            <li>Cycles</li>
            <li>Hostel Gear</li>
          </ul>
        </div>
        <div className={styles.contact}>
          <h4>Support</h4>
          <p>Student Academic Council</p>
          <p>Vedant | Dhruv</p>
        </div>
      </div>
      <div className={styles.bottom}>
        &copy; {new Date().getFullYear()} Trado@IITGN. Built for HackRush'26.
      </div>
    </footer>
  );
}
