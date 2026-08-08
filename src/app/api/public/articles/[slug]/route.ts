import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicDetailInclude, serializeArticle } from "@/lib/publicSerialize";

export const dynamic = "force-dynamic";

// GET /api/public/articles/:slug — full published article + increments views
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: publicDetailInclude,
  });
  if (!article)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fire-and-forget view count bump.
  prisma.article
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  // Related: same primary category, excluding this one.
  const related = article.primaryCategoryId
    ? await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          primaryCategoryId: article.primaryCategoryId,
          NOT: { id: article.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: publicDetailInclude,
      })
    : [];

  return NextResponse.json({
    article: serializeArticle(article),
    related: related.map(serializeArticle),
  });
}
