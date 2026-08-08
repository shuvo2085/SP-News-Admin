import { prisma } from "@/lib/prisma";
import type { CategoryOption, AuthorOption } from "@/components/admin/ArticleEditor";

/** Flat category list (with parent name) for the editor's select. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const cats = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { parent: { select: { name: true } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentName: c.parent?.name ?? null,
  }));
}

export async function getAuthorOptions(): Promise<AuthorOption[]> {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return users.map((u) => ({ id: u.id, name: u.name }));
}
