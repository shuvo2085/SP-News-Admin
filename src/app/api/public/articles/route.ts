import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicListInclude, serializeArticle } from "@/lib/publicSerialize";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/public/articles?category=&featured=&breaking=&q=&page=&limit=
// Only PUBLISHED articles are returned. Consumed by the mobile app.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const featured = sp.get("featured");
  const breaking = sp.get("breaking");
  const q = sp.get("q")?.trim();
  const limit = Math.min(Number(sp.get("limit") ?? 20), 50);
  const page = Math.max(Number(sp.get("page") ?? 1), 1);

  const where: Prisma.ArticleWhereInput = { status: "PUBLISHED" };
  if (category) where.categories = { some: { slug: category } };
  if (featured === "true") where.featured = true;
  if (breaking === "true") where.breaking = true;
  if (q)
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: publicListInclude,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    items: rows.map(serializeArticle),
    total,
    page,
    limit,
    hasMore: page * limit < total,
  });
}
