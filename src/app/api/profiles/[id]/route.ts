import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        karmaScore: true,
        hostel: true,
        wing: true,
        roles: true,
        listings: {
          select: { id: true, title: true, price: true, status: true },
          take: 5,
        },
        reviewsReceived: {
          select: {
            rating: true,
            comment: true,
            reviewer: { select: { name: true, image: true } },
          },
          take: 10,
        },
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate average rating
    const avgRating =
      user.reviewsReceived.length > 0
        ? Math.round(
            (user.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) /
              user.reviewsReceived.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      ...user,
      averageRating: avgRating,
      reviewCount: user.reviewsReceived.length,
    });
  } catch (error) {
    console.error("[Profile GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  if (userId !== params.id) {
    // Allow if user is admin (can extend this)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, bio, avatar, contactPref, hostel, wing } = 
      await request.json();

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(avatar && { avatar }),
        ...(contactPref && { contactPref }),
        ...(hostel && { hostel }),
        ...(wing && { wing }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[Profile PUT] Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
