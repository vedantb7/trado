import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { recalculateKarma } from "@/lib/karma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { offerId, rating, comment, revieweeId } = await request.json();
    const reviewerId = (session.user as any).id;

    if (!offerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Offer ID and valid rating (1-5) required." }, { status: 400 });
    }

    // Check if offer exists and is completed
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer.status !== "Completed") {
      return NextResponse.json({ error: "You can only review after a completed transaction" }, { status: 400 });
    }

    // Deduplication check
    const existing = await prisma.review.findUnique({
      where: {
        offerId_reviewerId: {
          offerId,
          reviewerId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this transaction." }, { status: 409 });
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        offerId,
        reviewerId,
        reviewee: revieweeId,
        rating,
        comment,
      },
    });

    // Automatically recalculate aggregate karma for the user who was reviewed
    await recalculateKarma(revieweeId);

    return NextResponse.json(review);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
