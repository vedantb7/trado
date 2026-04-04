import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  try {
    const avg = await prisma.listing.aggregate({
      where: { 
        category: category as any,
        status: "Available" 
      },
      _avg: {
        price: true
      }
    });

    return NextResponse.json({ avg: avg._avg.price || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch average price" }, { status: 500 });
  }
}
