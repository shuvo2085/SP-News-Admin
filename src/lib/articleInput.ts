import { prisma } from "@/lib/prisma";
import { slugify, readTimeFromHtml } from "@/lib/slug";
import type { ArticleStatus, Prisma } from "@prisma/client";

export type ArticleInput = {
  title?: string;
  excerpt?: string | null;
  content?: string;
  status?: ArticleStatus;
  featured?: boolean;
  breaking?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  authorId?: string;
  featuredImageId?: string | null;
  primaryCategoryId?: string | null;
  categoryIds?: string[];
  tags?: string[]; // tag names
};

/** Ensure a slug is unique, ignoring the article being edited. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "article";
  let slug = root;
  let n = 1;
  // Loop until we find a free slug.
  // (small N in practice)
  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

/** Upsert tags by slug and return their ids for connect. */
async function resolveTagIds(names: string[]): Promise<string[]> {
  const clean = [...new Set(names.map((t) => t.trim()).filter(Boolean))];
  const ids: string[] = [];
  for (const name of clean) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

/** Build a Prisma create payload from raw input. */
export async function buildCreateData(
  input: ArticleInput
): Promise<Prisma.ArticleCreateInput> {
  const title = input.title?.trim() || "Untitled";
  const content = input.content ?? "";
  const status = input.status ?? "DRAFT";
  const slug = await uniqueSlug(title);

  // Default author to the editorial desk if not provided.
  let authorId = input.authorId;
  if (!authorId) {
    const editorial =
      (await prisma.user.findFirst({ where: { role: "EDITOR" } })) ??
      (await prisma.user.findFirst());
    authorId = editorial?.id;
  }
  if (!authorId) throw new Error("No author available");

  const tagIds = input.tags ? await resolveTagIds(input.tags) : [];

  return {
    title,
    slug,
    excerpt: input.excerpt ?? null,
    content,
    status,
    featured: input.featured ?? false,
    breaking: input.breaking ?? false,
    readTime: readTimeFromHtml(content),
    metaTitle: input.metaTitle ?? null,
    metaDescription: input.metaDescription ?? null,
    keywords: input.keywords ?? null,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
    author: { connect: { id: authorId } },
    ...(input.featuredImageId
      ? { featuredImage: { connect: { id: input.featuredImageId } } }
      : {}),
    ...(input.primaryCategoryId
      ? { primaryCategory: { connect: { id: input.primaryCategoryId } } }
      : {}),
    ...(input.categoryIds && input.categoryIds.length
      ? { categories: { connect: input.categoryIds.map((id) => ({ id })) } }
      : {}),
    ...(tagIds.length ? { tags: { connect: tagIds.map((id) => ({ id })) } } : {}),
  };
}

/** Build a Prisma update payload from raw input for an existing article. */
export async function buildUpdateData(
  id: string,
  input: ArticleInput,
  current: { status: ArticleStatus; publishedAt: Date | null; title: string }
): Promise<Prisma.ArticleUpdateInput> {
  const data: Prisma.ArticleUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title.trim() || "Untitled";
    // Keep slug fresh only while still a draft (avoid breaking published URLs).
    if (current.status !== "PUBLISHED") {
      data.slug = await uniqueSlug(input.title || current.title, id);
    }
  }
  if (input.excerpt !== undefined) data.excerpt = input.excerpt ?? null;
  if (input.content !== undefined) {
    data.content = input.content;
    data.readTime = readTimeFromHtml(input.content);
  }
  if (input.featured !== undefined) data.featured = input.featured;
  if (input.breaking !== undefined) data.breaking = input.breaking;
  if (input.metaTitle !== undefined) data.metaTitle = input.metaTitle ?? null;
  if (input.metaDescription !== undefined)
    data.metaDescription = input.metaDescription ?? null;
  if (input.keywords !== undefined) data.keywords = input.keywords ?? null;

  if (input.status !== undefined) {
    data.status = input.status;
    // Stamp publishedAt the first time it goes live.
    if (input.status === "PUBLISHED" && !current.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  if (input.authorId !== undefined)
    data.author = { connect: { id: input.authorId } };

  if (input.featuredImageId !== undefined)
    data.featuredImage = input.featuredImageId
      ? { connect: { id: input.featuredImageId } }
      : { disconnect: true };

  if (input.primaryCategoryId !== undefined)
    data.primaryCategory = input.primaryCategoryId
      ? { connect: { id: input.primaryCategoryId } }
      : { disconnect: true };

  if (input.categoryIds !== undefined)
    data.categories = { set: input.categoryIds.map((cid) => ({ id: cid })) };

  if (input.tags !== undefined) {
    const tagIds = await resolveTagIds(input.tags);
    data.tags = { set: tagIds.map((tid) => ({ id: tid })) };
  }

  return data;
}
