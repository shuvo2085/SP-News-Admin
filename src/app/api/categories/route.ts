import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

// GET /api/categories — all categories with parent + article counts
export async function GET() {
  const items = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { articles: true, primaryArticles: true } },
    },
  });
  return NextResponse.json({ items });
}

// POST /api/categories — { name, parentId?, description? }
export async function POST(req: NextRequest) {
  try {
    const { name, parentId, description } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = slugify(name);
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists)
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );

    const max = await prisma.category.aggregate({ _max: { order: true } });
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description ?? null,
        parentId: parentId || null,
        order: (max._max.order ?? 0) + 1,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("Create category failed:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 400 });
  }
}
