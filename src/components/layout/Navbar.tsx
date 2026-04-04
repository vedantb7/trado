"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";

    setTheme(activeTheme);
    document.documentElement.dataset.theme = activeTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Bazaar<span>@IITGN</span>
        </Link>

        <div className={styles.links}>
          <Link href="/listings">Browse</Link>
          <button type="button" onClick={toggleTheme} className={styles.themeToggle}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          {session ? (
            <>
              <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link href="/sell" className="btn-primary">Sell Item</Link>
              <div className={styles.userMenu}>
                <span className={styles.karma}>Karma: {(session.user as any)?.karmaScore || 0}</span>
                <button onClick={() => signOut()} className={styles.authBtn}>Logout</button>
              </div>
            </>
          ) : (
            <button onClick={() => router.push("/login")} className="btn-primary">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
