import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateHandshakeCode } from "@/lib/handshake";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const offerId = params.id;
    const userId = (session.user as any).id;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    // Only the seller of the listing can generate the handshake code
    if (offer.listing.sellerId !== userId) {
      return NextResponse.json({ error: "Only the seller can generate a handshake code" }, { status: 403 });
    }

    if (offer.status !== "Accepted") {
      return NextResponse.json({ error: "Offer must be Accepted to generate a code" }, { status: 400 });
    }

    const handshakeCode = generateHandshakeCode();

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { handshakeCode },
    });

    return NextResponse.json({ handshakeCode: updatedOffer.handshakeCode });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate handshake code" }, { status: 500 });
  }
}
