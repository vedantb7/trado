"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AdminFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Very basic UI-level role check before API blocks it anyway
      const roles = (session.user as any)?.roles || [];
      if (!roles.includes("Admin")) {
        router.push("/");
      } else {
        fetchFlags();
      }
    }
  }, [status, router, session]);

  const fetchFlags = async () => {
    try {
      const res = await fetch("/api/flags");
      if (res.ok) {
        setFlags(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    // In a real app we'd call a PATCH route to update status, 
    // but for now we'll just optimistically hide it or delete it.
    alert("Flag dismissed.");
    setFlags(flags.filter(f => f.id !== id));
  };

  const handleDeleteListing = async (targetId: string, flagId: string) => {
    if (!window.confirm("WARNING: This will permanently delete the offending Listing from the database. Proceed?")) return;

    try {
      const res = await fetch(`/api/listings/${targetId}`, { method: "DELETE" });
      if (res.ok) {
        alert("Listing deleted successfully. Flag resolved.");
        setFlags(flags.filter(f => f.id !== flagId));
      } else {
        alert("Failed to delete listing.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || status === "loading") {
    return <div style={{padding: "5rem", textAlign: "center"}}>Verifying Authority...</div>;
  }

  return (
    <div>
      <Navbar />
      <main style={{ padding: "8rem 2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Moderation Command Center</h1>
        <p style={{ color: "var(--muted)", marginBottom: "3rem" }}>Review flags reported by the community.</p>

        {flags.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "var(--glass)", borderRadius: "1rem" }}>
            <h3 style={{ fontSize: "1.5rem" }}>All Clear! 🟩</h3>
            <p style={{ color: "var(--muted)" }}>No pending flags in the queue.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {flags.map(flag => (
              <div key={flag.id} style={{ padding: "2rem", background: "rgba(239, 68, 68, 0.05)", border: "1px dashed var(--danger)", borderRadius: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ color: "var(--danger)", textTransform: "uppercase", fontSize: "0.8რემ", letterSpacing: "0.1em" }}>
                      🚨 {flag.reason}
                    </h3>
                    <p style={{ marginTop: "0.5rem", fontSize: "1.2rem" }}>Target ID: <code style={{background: "var(--background)", padding: "0.2rem"}}>{flag.targetId}</code></p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Reported by: {flag.reporter?.name}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{new Date(flag.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {flag.description && (
                  <div style={{ padding: "1rem", background: "var(--background)", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
                    <strong>Details:</strong> {flag.description}
                  </div>
                )}

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button 
                    onClick={() => handleDismiss(flag.id)}
                    style={{ padding: "0.75rem 1.5rem", background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "0.5rem", cursor: "pointer" }}
                  >
                    Dismiss Flag
                  </button>
                  {flag.type === "listing" && (
                    <button 
                      onClick={() => handleDeleteListing(flag.targetId, flag.id)}
                      style={{ padding: "0.75rem 1.5rem", background: "var(--danger)", border: "none", color: "white", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "bold" }}
                    >
                      Delete Offending Listing
                    </button>
                  )}
                  <button
                     onClick={() => window.open(`/listings/${flag.targetId}`, "_blank")}
                     style={{ padding: "0.75rem 1.5rem", background: "var(--secondary)", border: "none", color: "var(--primary)", borderRadius: "0.5rem", cursor: "pointer" }}
                  >
                    Inspect Target ↗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
