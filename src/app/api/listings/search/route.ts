import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category");
  const hostel = searchParams.get("hostel");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "newest";
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = parseInt(searchParams.get("skip") || "0");

  try {
    const whereClause: any = {
      status: "Available",
    };

    // Text search in title and description
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      whereClause.category = category;
    }

    // Hostel filter
    if (hostel && hostel !== "all") {
      whereClause.locationHostel = hostel;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) {
        whereClause.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        whereClause.price.lte = parseFloat(maxPrice);
      }
    }

    // Sort options
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "price-low") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-high") {
      orderBy = { price: "desc" };
    } else if (sortBy === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (sortBy === "urgent") {
      orderBy = [{ isUrgent: "desc" }, { createdAt: "desc" }];
    }

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where: whereClause,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              avatar: true,
              karmaScore: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      listings,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      { error: "Failed to search listings" },
      { status: 500 }
    );
  }
}
