"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Bazaar<span>@IITGN</span>
        </Link>

        <div className={styles.links}>
          <Link href="/listings">Browse</Link>
          {session ? (
            <>
              <Link href="/sell" className="btn-primary">Sell Item</Link>
              <div className={styles.userMenu}>
                <span className={styles.karma}>Karma: {session.user?.karmaScore || 0}</span>
                <button onClick={() => signOut()} className={styles.authBtn}>Logout</button>
              </div>
            </>
          ) : (
            <button onClick={() => signIn("google")} className="btn-primary">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
