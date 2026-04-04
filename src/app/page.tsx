"use client";

import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HomeHero from "@/components/home/HomeHero";
import AuthenticatedHome from "@/components/home/AuthenticatedHome";
import styles from "./page.module.css";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className={styles.loading}>Loading Trado...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <Navbar />
      <main className={styles.mainContainer}>
        {session ? <AuthenticatedHome user={session.user} /> : <HomeHero />}
      </main>
      <Footer />
    </div>
  );
}
