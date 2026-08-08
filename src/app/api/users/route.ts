import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/users — list (no password hashes)
export async function GET() {
  const items = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
  });
  return NextResponse.json({ items });
}

// POST /api/users — { name, email, password, role }
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, bio } = await req.json();
    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
        role: role ?? "AUTHOR",
        bio: bio ?? null,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Create user failed:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
  }
}
