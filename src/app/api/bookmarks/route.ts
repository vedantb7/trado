import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: (session.user as any).id },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                name: true,
                image: true,
                karmaScore: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("[Bookmarks GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { listingId } = await request.json();
    const userId = (session.user as any).id;

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      // Fetch current listing price for price-drop tracking
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { price: true }
      });

      // Add bookmark
      const bookmark = await prisma.bookmark.create({
        data: { 
          userId, 
          listingId,
          priceAtBookmark: listing?.price || 0
        },
      });
      return NextResponse.json({ bookmarked: true, bookmark });
    }
  } catch (error) {
    console.error("[Bookmarks POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
