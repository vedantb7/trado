import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateKarma } from "@/lib/karma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, priceCountered } = await request.json();
    const offerId = params.id;

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    // Authorization check (Buyer or Seller)
    const isBuyer = offer.buyerId === (session.user as any).id;
    const isSeller = offer.listing.sellerId === (session.user as any).id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // State Machine logic
    const updateData: any = { status };
    if (priceCountered) updateData.priceOffered = priceCountered;

    // Concurrency Check: If accepting, mark item as Reserved. If completing, mark as Sold.
    if (status === "Accepted") {
      await prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: "Reserved" },
      });
    } else if (status === "Completed") {
      await prisma.listing.update({
        where: { id: offer.listingId },
        data: { status: "Sold" },
      });
      // Update Karma for both parties
      await updateKarma(offer.buyerId, "TRADE_COMPLETED");
      await updateKarma(offer.listing.sellerId, "TRADE_COMPLETED");
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
    });

    return NextResponse.json(updatedOffer);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
