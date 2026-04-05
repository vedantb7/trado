"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import styles from "./page.module.css";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className={styles.wrapper}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          Trado<span>@IITGN</span>
        </Link>
        <p className={styles.tagline}>The Campus Marketplace</p>

        <div className={styles.content}>
          <div className={styles.iconWrapper}>
             <span className={styles.lockIcon}>🛡️</span>
          </div>
          <h1>Campus Access Only</h1>
          <p className={styles.description}>
            Trado is a verified marketplace for the IIT Gandhinagar community. 
            Sign in with your institutional account to continue.
          </p>

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className={styles.googleBtn}
          >
            {loading ? (
              <span className={styles.loader}>Connecting...</span>
            ) : (
              <>
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className={styles.googleIcon} />
                Sign in with Google
              </>
            )}
          </button>
        </div>

        <p className={styles.footer}>
          Strictly restricted to <strong>@iitgn.ac.in</strong> domains.
        </p>
      </div>
    </div>
  );
}
