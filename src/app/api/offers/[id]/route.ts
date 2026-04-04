import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateKarma } from "@/lib/karma";
import { verifyHandshake } from "@/lib/handshake";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        listing: {
          include: {
            seller: {
              select: { name: true, avatar: true, karmaScore: true }
            }
          }
        },
        buyer: {
          select: { name: true, avatar: true, karmaScore: true }
        },
        room: {
          include: {
            messages: {
              orderBy: {
                timestamp: "asc"
              }
            }
          }
        }
      },
    });

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    // Authorization check
    const isBuyer = offer.buyerId === (session.user as any).id;
    const isSeller = offer.listing.sellerId === (session.user as any).id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, priceCountered, handshakeCode } = await request.json().catch(() => ({}));
    const offerId = params.id;

    const offer = await (prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    }) as any);

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    // Authorization check (Buyer or Seller)
    const userId = (session.user as any).id;
    const isBuyer = offer.buyerId === userId;
    const isSeller = offer.listing.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // State Machine logic
    const updateData: any = { status };
    if (priceCountered) updateData.priceOffered = priceCountered;

    // Atomic Concurrency & Logic Check
    if (status === "Accepted") {
      await prisma.$transaction(async (tx) => {
        // [Verified Concurrency] Re-fetch listing inside transaction to ensure it's still available
        const currentListing = await (tx.listing.findUnique({
          where: { id: offer.listingId },
        }) as any);

        if (!currentListing || currentListing.status !== "Available") {
          throw new Error("Item is no longer available for new deals.");
        }

        // 1. Reserve the listing
        await tx.listing.update({
          where: { id: offer.listingId },
          data: { status: "Reserved" },
        });

        // 2. Accept this offer
        await tx.offer.update({
          where: { id: offerId },
          data: { status: "Accepted" },
        });

        // (Optionally) decline all other pending offers for this listing
        await tx.offer.updateMany({
          where: {
            listingId: offer.listingId,
            id: { not: offerId },
            status: "Proposed",
          },
          data: { status: "Declined" },
        });
      });
      const updatedFullOffer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { 
          listing: { include: { seller: { select: { name: true, karmaScore: true } } } }, 
          buyer: { select: { name: true, karmaScore: true } }, 
          room: true 
        },
      });
      return NextResponse.json(updatedFullOffer || { success: true, status: "Accepted" });
    } else if (status === "Completed") {
      if (offer.status !== "Accepted") {
        return NextResponse.json({ error: "Offer must be Accepted before it can be Completed" }, { status: 400 });
      }
      
      const body = await request.json().catch(() => ({}));
      const providedCode = body.handshakeCode;
      
      if (!offer.handshakeCode || !providedCode || !verifyHandshake(providedCode, offer.handshakeCode)) {
        return NextResponse.json({ error: "Invalid Handshake Code" }, { status: 400 });
      }
      
      await prisma.$transaction([
         prisma.listing.update({
            where: { id: offer.listingId },
            data: { status: "Sold" },
         }),
         prisma.offer.update({
            where: { id: offerId },
            data: { status: "Completed" },
         }),
         prisma.user.update({
            where: { id: offer.buyerId },
            data: { karmaScore: { increment: 10 } }
         }),
         prisma.user.update({
            where: { id: offer.listing.sellerId },
            data: { karmaScore: { increment: 10 } }
         })
      ]);
      
      const completedOffer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { 
          listing: { include: { seller: { select: { name: true, karmaScore: true } } } }, 
          buyer: { select: { name: true, karmaScore: true } }, 
          room: true 
        },
      });
      return NextResponse.json(completedOffer || { success: true, status: "Completed" });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
    });

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
