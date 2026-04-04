import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: { id: true, name: true, avatar: true, karmaScore: true },
        },
        // Include offers if the requester is the seller
        offers: {
          include: {
            buyer: { select: { id: true, name: true, avatar: true, karmaScore: true } },
            room: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Security check: Only the seller should see the offers list
    const isOwner = userId && listing.sellerId === userId;
    const responseData = { ...listing };
    if (!isOwner) {
      delete (responseData as any).offers;
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("[listing-detail]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listingId = params.id;
    const userId = (session.user as any).id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cascade delete is handled by Prisma schema if configured, or manual cleanup here
    await prisma.listing.delete({
      where: { id: listingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[listing-delete]", error);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
