import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin (can extend this logic)
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!user || !user.roles.includes("Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Pending";

    const flags = await prisma.flag.findMany({
      where: { status: status as any },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(flags);
  } catch (error) {
    console.error("[Flags GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch flags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, targetId, reason, description } = await request.json();
    const reporterId = (session.user as any).id;

    if (!["listing", "user"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid flag type" },
        { status: 400 }
      );
    }

    // Deduplication check
    const existing = await prisma.flag.findFirst({
      where: {
        targetId,
        reporterId,
        status: "Pending"
      }
    });

    if (existing) {
      return NextResponse.json({ error: "You have already filed a report for this target which is pending review." }, { status: 429 });
    }

    // Create flag
    const flag = await prisma.flag.create({
      data: {
        type,
        targetId,
        reporterId,
        reason,
        description,
      },
    });

    return NextResponse.json(flag);
  } catch (error) {
    console.error("[Flags POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create flag" },
      { status: 500 }
    );
  }
}
