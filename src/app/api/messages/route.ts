import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  // Reserved system rooms do not have chat messages
  if (!roomId || ["listings", "dashboard", "notifications"].includes(roomId)) {
    return NextResponse.json([]);
  }

  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    // Specifically handle invalid ObjectId formats or Prisma search failures
    console.warn(`[Messages API] Invalid Room ID or query failure: ${roomId}`);
    return NextResponse.json([], { status: 200 }); // Return empty instead of 500 for UI stability
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomId, content, isSystem } = await request.json();

    if (["listings", "dashboard", "notifications"].includes(roomId)) {
      return NextResponse.json({ error: "Cannot send messages to system rooms" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        content,
        isSystem: isSystem ?? false,
        // System messages have no sender
        ...(isSystem ? {} : { senderId: (session.user as any).id }),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}
