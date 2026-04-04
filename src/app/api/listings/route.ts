import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const hostel = searchParams.get("hostel");
  const query = searchParams.get("q");

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
      include: {
        seller: {
          select: {
            name: true,
            avatar: true,
            karmaScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(listings);
  } catch (error) {
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

    const listing = await prisma.listing.create({
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

    return NextResponse.json(listing);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
