import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { listingId, priceOffered } = await request.json();

    // Create offer and associated ChatRoom
    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: (session.user as any).id,
        priceOffered,
        status: "Proposed",
        room: {
          create: {}
        }
      },
      include: {
        room: true
      }
    });

    return NextResponse.json(offer);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to propose offer" }, { status: 500 });
  }
}
