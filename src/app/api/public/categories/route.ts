import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/categories — nav tree (top-level with children)
export async function GET() {
  const cats = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: { orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } },
    },
  });
  return NextResponse.json({
    items: cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      children: c.children,
    })),
  });
}
