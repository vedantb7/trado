import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIO } from "@/lib/socket";
import { attachSellersToListings } from "@/lib/listingsWithSellers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const hostel = searchParams.get("hostel");
  const query = searchParams.get("q");
  const limitRaw = searchParams.get("limit");
  const parsedLimit = limitRaw
    ? Math.min(Math.max(parseInt(limitRaw, 10) || 0, 1), 100)
    : null;

  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: "Available",
        ...(category && { category: category as any }),
        ...(hostel && { locationHostel: hostel as any }),
        ...(query && {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      ...(parsedLimit != null ? { take: parsedLimit } : {}),
    });

    const withSellers = await attachSellersToListings(listings);
    return NextResponse.json(withSellers);
  } catch (error) {
    console.error("GET /api/listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
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

    const { title, description, category, price, images, isUrgent, locationHostel } = body;

    // Validation: All fields required
    if (!title?.trim() || !category || price === undefined) {
      return NextResponse.json({ error: "Title, category, and price are required." }, { status: 400 });
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
    }

    // AI Brownie Point: Automatic Tagging from Title/Description
    const keywords = [...title.toLowerCase().split(" "), ...(description?.toLowerCase().split(" ") || [])];
    const commonTags = ["used", "mint", "hostel", "urgent", "iitgn", "campus"];
    const autoTags = keywords.filter(w => commonTags.includes(w) || w.length > 5).slice(0, 5);

    const created = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        category,
        price: Number(price),
        images: images || [],
        isUrgent: !!isUrgent,
        locationHostel,
        tags: autoTags,
        sellerId: (session.user as any).id,
      },
    });
    const [listing] = await attachSellersToListings([created]);

    // Broadcast to all connected clients so home/listings pages update live
    try {
      const io = getIO();
      if (io) io.emit("listing_created", listing);
    } catch { }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Critical error in POST /api/listings:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

