import type { Prisma } from "@prisma/client";

// Article shape returned to the mobile app (list vs detail).
export type PublicArticle = ReturnType<typeof serializeArticle>;

const listInclude = {
  author: { select: { name: true } },
  primaryCategory: { select: { name: true, slug: true } },
  featuredImage: { select: { url: true, alt: true } },
} satisfies Prisma.ArticleInclude;

export const publicListInclude = listInclude;

export const publicDetailInclude = {
  ...listInclude,
  categories: { select: { name: true, slug: true } },
  tags: { select: { name: true, slug: true } },
} satisfies Prisma.ArticleInclude;

type ArticleWithRels = Prisma.ArticleGetPayload<{ include: typeof publicDetailInclude }>;

export function serializeArticle(a: ArticleWithRels | Prisma.ArticleGetPayload<{ include: typeof listInclude }>) {
  const anyA = a as ArticleWithRels;
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    image: a.featuredImage?.url ?? null,
    imageAlt: a.featuredImage?.alt ?? null,
    author: a.author?.name ?? "SP News Editorial",
    category: a.primaryCategory?.name ?? null,
    categorySlug: a.primaryCategory?.slug ?? null,
    readTime: a.readTime,
    breaking: a.breaking,
    featured: a.featured,
    views: a.views,
    publishedAt: a.publishedAt,
    // detail-only fields (undefined on list payloads)
    content: "content" in a ? a.content : undefined,
    categories: anyA.categories?.map((c) => ({ name: c.name, slug: c.slug })),
    tags: anyA.tags?.map((t) => ({ name: t.name, slug: t.slug })),
  };
}
