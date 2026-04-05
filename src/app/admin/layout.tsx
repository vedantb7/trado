import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles || [];

  if (!roles.includes("Admin")) {
    redirect("/");
  }

  return (
    <div className="admin-wrapper" style={{background: 'var(--background)', minHeight: '100vh'}}>
      <Navbar />
      <div style={{padding: '7rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em'}}>Command Center</h1>
          <p style={{color: 'var(--muted)', fontSize: '1.1rem'}}>Admin Management Portal</p>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}
