import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  // RBAC Check
  const roles = (session?.user as any)?.roles || [];
  if (!roles.includes("Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const offers = await prisma.offer.findMany({
      include: {
        buyer: {
          select: { name: true, email: true }
        },
        listing: {
          include: {
            seller: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("[Admin Offers GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
