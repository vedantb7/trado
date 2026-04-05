import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getIO } from "@/lib/socket";
import { attachSellersToListings } from "@/lib/listingsWithSellers";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // 'buying' or 'selling'
  const userId = (session.user as any).id;

  try {
    let offers: any[] = [];
    if (type === "buying") {
      const rows = await prisma.offer.findMany({
        where: { buyerId: userId },
        include: { listing: true },
        orderBy: { updatedAt: "desc" },
      });
      const listings = rows.map((o) => o.listing);
      const enriched = await attachSellersToListings(listings);
      const byListingId = new Map(enriched.map((l) => [l.id, l]));
      offers = rows.map((o) => ({
        ...o,
        listing: byListingId.get(o.listingId)!,
      }));
    } else if (type === "selling") {
      offers = await prisma.offer.findMany({
        where: {
          listing: {
            sellerId: userId
          }
        },
        include: {
          buyer: { select: { name: true, image: true, karmaScore: true } },
          listing: {
            select: { title: true, price: true, images: true, status: true },
          },
        },
        orderBy: { updatedAt: "desc" }
      });
    }

    return NextResponse.json(offers);
  } catch (error) {
    console.error("[Offers GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { listingId, priceOffered } = body;

    if (!listingId || priceOffered === undefined) {
      return NextResponse.json({ error: "Listing ID and offer price are required." }, { status: 400 });
    }

    // 1. Verify listing exists and is available
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.status !== "Available") {
      return NextResponse.json({ error: "This item is no longer available for offers." }, { status: 400 });
    }

    // 2. Prevent seller from offering on their own item
    if (listing.sellerId === (session.user as any).id) {
      return NextResponse.json({ error: "You cannot make an offer on your own item." }, { status: 403 });
    }

    // 3. Create offer and associated ChatRoom
    const offer = await prisma.offer.create({
      data: {
        listingId,
        buyerId: (session.user as any).id,
        priceOffered: Number(priceOffered),
        lastPriceBy: (session.user as any).id,
        status: "Proposed",
        room: {
          create: {}
        }
      },
      include: {
        room: true
      }
    });

    // Emit to notify the seller in real-time
    try {
      const io = getIO();
      if (io) {
        // Fetch the listing's sellerId to target the right user
        io.emit("new_offer", { sellerId: listing.sellerId, offerId: offer.id });
      }
    } catch {}

    return NextResponse.json(offer);
  } catch (error: any) {
    console.error("[Offers POST ERROR]", error);
    return NextResponse.json({ error: "Failed to propose offer.", details: error.message }, { status: 500 });
  }
}
