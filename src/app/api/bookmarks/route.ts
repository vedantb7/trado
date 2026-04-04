import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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
                avatar: true,
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
      // Add bookmark
      const bookmark = await prisma.bookmark.create({
        data: { userId, listingId },
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
