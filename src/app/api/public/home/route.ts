import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicListInclude, serializeArticle } from "@/lib/publicSerialize";

export const dynamic = "force-dynamic";

// GET /api/public/home — one bundle for the mobile app home screen.
export async function GET() {
  const base = { status: "PUBLISHED" as const };

  const [breaking, featured, latest, sections] = await Promise.all([
    prisma.article.findMany({
      where: { ...base, breaking: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: publicListInclude,
    }),
    prisma.article.findMany({
      where: { ...base, featured: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: publicListInclude,
    }),
    prisma.article.findMany({
      where: base,
      orderBy: { publishedAt: "desc" },
      take: 15,
      include: publicListInclude,
    }),
    // A few top categories each with their latest stories.
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      take: 6,
      select: {
        name: true,
        slug: true,
        articles: {
          where: base,
          orderBy: { publishedAt: "desc" },
          take: 4,
          include: publicListInclude,
        },
      },
    }),
  ]);

  return NextResponse.json({
    breaking: breaking.map(serializeArticle),
    featured: featured.map(serializeArticle),
    trending: latest.slice(0, 5).map(serializeArticle),
    latest: latest.map(serializeArticle),
    sections: sections
      .filter((s) => s.articles.length > 0)
      .map((s) => ({
        name: s.name,
        slug: s.slug,
        articles: s.articles.map(serializeArticle),
      })),
  });
}
