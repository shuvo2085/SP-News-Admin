import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArticleEditor,
  type ArticleData,
} from "@/components/admin/ArticleEditor";
import { getCategoryOptions, getAuthorOptions } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, categories, authors] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        tags: { select: { name: true } },
        featuredImage: { select: { id: true, url: true } },
      },
    }),
    getCategoryOptions(),
    getAuthorOptions(),
  ]);

  if (!article) notFound();

  const data: ArticleData = {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    status: article.status,
    featured: article.featured,
    breaking: article.breaking,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    keywords: article.keywords,
    authorId: article.authorId,
    primaryCategoryId: article.primaryCategoryId,
    featuredImageId: article.featuredImageId,
    featuredImage: article.featuredImage,
    categories: article.categories,
    tags: article.tags,
  };

  return (
    <ArticleEditor categories={categories} authors={authors} article={data} />
  );
}
