import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Regex: only @iitgn.ac.in addresses allowed */
const IITGN_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@iitgn\.ac\.in$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    // 1. Validation: All fields required
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and password are all required." },
        { status: 400 }
      );
    }

    // 2. Validation: IITGN email with regex
    if (!IITGN_EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Only @iitgn.ac.in email addresses are permitted." },
        { status: 403 }
      );
    }

    // 3. Check for duplicate
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Hash the password (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error("[register ERROR]", error);
    return NextResponse.json(
      { 
        error: "Registration failed due to a server error.", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
