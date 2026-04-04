import prisma from "./prisma";

/**
 * Formula for Karma Calculation:
 * 1. Base Score = 10 
 * 2. Account Age = Up to +20 points (based on days active / 30)
 * 3. Trades Completed = +5 points per completed offer
 * 4. Peer Reviews = Weighted average impact
 *    - Formula: (Avg Rating - 3) * (min(count, 20) * 1.5)
 *    - Single 5-star review adds little (+3), but consistent 5-stars add massive trust (+60 max)
 *    - Consistent 1-stars subtract massively (-60 max)
 */
export async function recalculateKarma(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true }
  });

  if (!user) return 0;

  // 1. Account Age (Safe cap of +20 points ~ 1 year active)
  const daysActive = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const ageKarma = Math.min(20, (daysActive / 30) * 2);

  // 2. Trades Completed (Buyer or Seller)
  const completedDeals = await prisma.offer.count({
    where: {
      status: "Completed",
      OR: [
        { buyerId: userId },
        { listing: { sellerId: userId } }
      ]
    }
  });
  const tradesKarma = completedDeals * 5;

  // 3. Peer Reviews
  const reviews = await prisma.review.findMany({
    where: { reviewee: userId },
    select: { rating: true }
  });

  let reviewKarma = 0;
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    // Math: shift so 3 stars = 0 effect. Scale by volume to prevent single-order bias.
    // Max positive impact at 20+ reviews of 5-stars = (5-3) * 20 * 1.5 = +60.
    const volumeMultiplier = Math.min(reviews.length, 20) * 1.5;
    reviewKarma = (avgRating - 3) * volumeMultiplier;
  }

  // Base score + calculations
  const finalScore = Math.max(0, Math.round(10 + ageKarma + tradesKarma + reviewKarma));

  // Sync to database
  await prisma.user.update({
    where: { id: userId },
    data: { karmaScore: finalScore }
  });

  return finalScore;
}
