import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { updateKarma } from "@/lib/karma";
import { verifyHandshake } from "@/lib/handshake";
import { getIO } from "@/lib/socket";

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
              select: { id: true, name: true, avatar: true, karmaScore: true }
            }
          }
        },
        buyer: {
          select: { id: true, name: true, avatar: true, karmaScore: true }
        },
        room: {
          include: {
            messages: {
              orderBy: {
                timestamp: "asc"
              },
              include: {
                sender: { select: { id: true, name: true, avatar: true } }
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
    const body = await request.json().catch(() => ({}));
    const { status, priceCountered, handshakeCode } = body;
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
    
    if (priceCountered !== undefined && priceCountered !== null) {
      const p = parseFloat(priceCountered as any);
      if (!isNaN(p)) {
        updateData.priceOffered = p;
        updateData.lastPriceBy = (session.user as any).id;
      }
    }

    // State Machine Guard: block counters if deal is already locked
    if ((status === "Countered") && (offer.status === "Accepted" || offer.status === "Completed" || offer.status === "Declined")) {
      return NextResponse.json({ error: "Negotiations are closed for this offer." }, { status: 400 });
    }

    // Atomic Concurrency & Logic Check
    if (status === "Accepted") {
      // Check if a DIFFERENT offer for this listing is already accepted
      const conflictingOffer = await prisma.offer.findFirst({
        where: {
          listingId: offer.listingId,
          id: { not: offerId },
          status: "Accepted",
        },
      });
      if (conflictingOffer) {
        return NextResponse.json({ error: "Another offer for this item has already been accepted." }, { status: 409 });
      }

      // Update offer and reserve listing atomically
      await prisma.offer.update({ where: { id: offerId }, data: { status: "Accepted" } });
      await prisma.listing.update({ where: { id: offer.listingId }, data: { status: "Reserved" } });
      // Decline all other pending offers
      await prisma.offer.updateMany({
        where: { listingId: offer.listingId, id: { not: offerId }, status: { in: ["Proposed", "Countered"] } },
        data: { status: "Declined" },
      });

      const updatedFullOffer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: {
          listing: { include: { seller: { select: { id: true, name: true, avatar: true, karmaScore: true } } } },
          buyer: { select: { id: true, name: true, avatar: true, karmaScore: true } },
          room: true,
        },
      });
      // Server-side broadcast
      try {
        const io = getIO();
        if (io && updatedFullOffer) {
          io.emit("offer_status_changed", { offerId, updatedOffer: updatedFullOffer });
          io.emit("listing_updated", { id: offer.listingId, status: "Reserved" });
        }
      } catch {}
      return NextResponse.json(updatedFullOffer);
    } else if (status === "Completed") {
      if (offer.status !== "Accepted") {
        return NextResponse.json({ error: "Offer must be Accepted before it can be Completed" }, { status: 400 });
      }
      
      const providedCode = handshakeCode;
      
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
          listing: { include: { seller: { select: { id: true, name: true, avatar: true, karmaScore: true } } } }, 
          buyer: { select: { id: true, name: true, avatar: true, karmaScore: true } }, 
          room: true 
        },
      });
      // Server-side broadcast: deal closed
      try {
        const io = getIO();
        if (io && completedOffer) {
          io.emit("offer_status_changed", { offerId, updatedOffer: completedOffer });
          io.emit("listing_updated", { id: offer.listingId, status: "Sold" });
        }
      } catch {}
      return NextResponse.json(completedOffer || { success: true, status: "Completed" });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
      include: { 
        listing: { include: { seller: { select: { id: true, name: true, avatar: true, karmaScore: true } } } }, 
        buyer: { select: { id: true, name: true, avatar: true, karmaScore: true } }, 
        room: true 
      },
    });

    // Server-side broadcast for counter/decline updates too
    try {
      const io = getIO();
      if (io) io.emit("offer_status_changed", { offerId, updatedOffer: updatedOffer });
    } catch {}

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
