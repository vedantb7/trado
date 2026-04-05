import prisma from "@/lib/prisma";

export const listingSellerSelect = {
  id: true,
  name: true,
  image: true,
  karmaScore: true,
} as const;

export type ListingSellerPublic = {
  id: string;
  name: string | null;
  image: string | null;
  karmaScore: number;
};

/** Use when API responses must always include a seller object (orphan listings). */
export function withFallbackSeller<
  T extends { sellerId: string; seller: ListingSellerPublic | null },
>(listing: T): Omit<T, "seller"> & { seller: ListingSellerPublic } {
  return {
    ...listing,
    seller:
      listing.seller ?? {
        id: listing.sellerId,
        name: "Unavailable",
        image: null,
        karmaScore: 0,
      },
  };
}

/**
 * MongoDB does not enforce foreign keys; Prisma throws if `include: { seller }`
 * is used when the seller user row is missing. Load sellers in a second query instead.
 */
export async function attachSellersToListings<T extends { sellerId: string }>(
  listings: T[]
): Promise<Array<T & { seller: ListingSellerPublic | null }>> {
  if (listings.length === 0) return [];
  const sellerIds = Array.from(new Set(listings.map((l) => l.sellerId)));
  const sellers = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: listingSellerSelect,
  });
  const map = new Map(sellers.map((s) => [s.id, s]));
  return listings.map((l) => ({
    ...l,
    seller: map.get(l.sellerId) ?? null,
  }));
}
