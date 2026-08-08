import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCreateData, type ArticleInput } from "@/lib/articleInput";
import type { ArticleStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/articles?status=&q=&category=&take=&skip=
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") as ArticleStatus | null;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const take = Math.min(Number(sp.get("take") ?? 50), 100);
  const skip = Number(sp.get("skip") ?? 0);

  const where: Prisma.ArticleWhereInput = {};
  if (status) where.status = status;
  if (q)
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];
  if (category) where.categories = { some: { slug: category } };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
      include: {
        author: { select: { id: true, name: true } },
        primaryCategory: { select: { id: true, name: true, slug: true } },
        featuredImage: { select: { id: true, url: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}

// POST /api/articles  — create a new article (draft by default)
export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as ArticleInput;
    const data = await buildCreateData(input);
    const article = await prisma.article.create({ data });
    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    console.error("Create article failed:", err);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 400 }
    );
  }
}
