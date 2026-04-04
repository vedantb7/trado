"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

/** Must match the server-side regex */
const IITGN_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@iitgn\.ac\.in$/i;

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear messages on tab change
  useEffect(() => {
    setError("");
    setSuccess("");
    setForm({ name: "", email: "", password: "", confirm: "" });
  }, [tab]);

  const validateEmail = (email: string) => IITGN_EMAIL_REGEX.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(form.email)) {
      setError("Please use your @iitgn.ac.in email address.");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(form.email)) {
      setError("Please use your @iitgn.ac.in email address.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
    } else {
      setSuccess("Account created! Signing you in…");
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          Bazaar<span>@IITGN</span>
        </Link>
        <p className={styles.tagline}>The Campus Marketplace</p>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "login" ? styles.activeTab : ""}`}
            onClick={() => setTab("login")}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${tab === "register" ? styles.activeTab : ""}`}
            onClick={() => setTab("register")}
          >
            Register
          </button>
        </div>

        {/* Error / Success banners */}
        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}
        {success && <div className={styles.successBanner}>✅ {success}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-email">IITGN Email</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="you@iitgn.ac.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {form.email && !validateEmail(form.email) && (
                <span className={styles.hint}>Must end with @iitgn.ac.in</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className={`btn-primary ${styles.submit}`}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                required
                placeholder="Aanya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-email">IITGN Email</label>
              <input
                id="reg-email"
                type="email"
                required
                placeholder="you@iitgn.ac.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {form.email && !validateEmail(form.email) && (
                <span className={styles.hint}>Must end with @iitgn.ac.in</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                required
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>

            <button type="submit" disabled={loading} className={`btn-primary ${styles.submit}`}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          By continuing, you agree that only IITGN students and staff can access this platform.
        </p>
      </div>
    </div>
  );
}
