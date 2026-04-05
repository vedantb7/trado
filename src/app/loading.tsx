import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.logo}>
        Trado<span>@IITGN</span>
      </div>
      <div className={styles.loader}></div>
      <div className={styles.text}>Syncing Campus Deals...</div>
    </div>
  );
}
