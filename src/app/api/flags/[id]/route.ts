import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
  });

  if (!user || !user.roles.includes("Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { status, resolution } = await request.json();

    if (!["Reviewed", "Resolved", "Dismissed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const flag = await prisma.flag.update({
      where: { id: params.id },
      data: { status, resolution },
    });

    // If resolved and type is user, consider suspending the user
    if (status === "Resolved" && flag.type === "user" && resolution?.includes("suspend")) {
      await prisma.user.update({
        where: { id: flag.targetId },
        data: {
          isSuspended: true,
          suspensionReason: resolution,
        },
      });
    }

    return NextResponse.json(flag);
  } catch (error) {
    console.error("[Flag Resolve] Error:", error);
    return NextResponse.json(
      { error: "Failed to resolve flag" },
      { status: 500 }
    );
  }
}
