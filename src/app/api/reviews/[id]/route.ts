import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateKarma } from "@/lib/karma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: { reviewee: params.id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
            karmaScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("[Reviews GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
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
    const { offerId, revieweeId, rating, comment } = await request.json();
    const reviewerId = (session.user as any).id;

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if offer exists and is completed
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer || offer.status !== "Completed") {
      return NextResponse.json(
        { error: "Can only review completed offers" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        offerId,
        reviewerId,
        reviewee: revieweeId,
        rating,
        comment,
      },
    });

    // Update karma based on rating
    await recalculateKarma(revieweeId);

    return NextResponse.json(review);
  } catch (error) {
    console.error("[Reviews POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
