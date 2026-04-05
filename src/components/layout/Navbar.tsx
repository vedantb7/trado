"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setIsMenuOpen(false); // Close menu on navigation
  }, [router]);

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
          Trado<span>@IITGN</span>
        </Link>

        {/* Hamburger Button */}
        <button 
          className={`${styles.hamburger} ${isMenuOpen ? styles.active : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`${styles.links} ${isMenuOpen ? styles.menuOpen : ""}`}>
          <Link href="/listings" onClick={() => setIsMenuOpen(false)}>Browse</Link>
          <button type="button" onClick={toggleTheme} className={styles.themeToggle}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          
          {session ? (
            <>
              {(session.user as any)?.roles?.includes("Admin") && (
                <Link href="/admin/orders" className={styles.adminNavLink} onClick={() => setIsMenuOpen(false)}>
                  🛠️ Admin
                </Link>
              )}
              <Link href="/profile" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Profile</Link>
              <Link href="/dashboard" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/sell" className="btn-primary" onClick={() => setIsMenuOpen(false)}>Sell Item</Link>
              <div className={styles.userMenu}>
                <span className={styles.karma}>Karma: {(session.user as any)?.karmaScore || 0}</span>
                <button onClick={() => { signOut(); setIsMenuOpen(false); }} className={styles.authBtn}>Logout</button>
              </div>
            </>
          ) : (
            <button onClick={() => { router.push("/login"); setIsMenuOpen(false); }} className="btn-primary">Login</button>
          )}
        </div>
      </div>
    </nav>
  );
}
