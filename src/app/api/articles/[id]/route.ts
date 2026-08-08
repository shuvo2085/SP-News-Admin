import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildUpdateData, type ArticleInput } from "@/lib/articleInput";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/articles/:id
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: true,
      primaryCategory: true,
      categories: true,
      tags: true,
      featuredImage: true,
    },
  });
  if (!article)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

// PATCH /api/articles/:id
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const input = (await req.json()) as ArticleInput;
    const current = await prisma.article.findUnique({
      where: { id },
      select: { status: true, publishedAt: true, title: true },
    });
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await buildUpdateData(id, input, current);
    const article = await prisma.article.update({ where: { id }, data });
    return NextResponse.json(article);
  } catch (err) {
    console.error("Update article failed:", err);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 400 }
    );
  }
}

// DELETE /api/articles/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete article failed:", err);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 400 }
    );
  }
}
