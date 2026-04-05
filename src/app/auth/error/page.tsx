"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "An unexpected authentication error occurred.";
  if (error === "OAuthSignin" || error === "OAuthCallback" || error === "OAuthCreateAccount") {
    errorMessage = "Google login failed. This usually happens if your credentials in .env are invalid or if your redirect URIs are not set correctly in Google Console.";
  } else if (error === "AccessDenied") {
    errorMessage = "Access restricted. You must use an @iitgn.ac.in email address to enter the marketplace.";
  } else if (error === "Configuration") {
    errorMessage = "There is a server configuration error. Please ensure NEXTAUTH_SECRET and GOOGLE_CLIENT_ID are set correctly.";
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1>🔒 Auth Error</h1>
        <p className={styles.errorText}>{errorMessage}</p>
        <div className={styles.details}>
           <code>Error Code: {error || "Unknown"}</code>
        </div>
        <Link href="/login" className="btn-primary">
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
