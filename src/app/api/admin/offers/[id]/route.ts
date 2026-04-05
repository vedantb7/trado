import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles || [];
  if (!roles.includes("Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { status, priceOffered } = await request.json();
    const updatedOffer = await prisma.offer.update({
      where: { id: params.id },
      data: { 
        status: status,
        priceOffered: priceOffered ? parseFloat(priceOffered) : undefined
      },
    });

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error("[Admin Offer PUT] Error:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as any)?.roles || [];
  if (!roles.includes("Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.offer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Offer DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
