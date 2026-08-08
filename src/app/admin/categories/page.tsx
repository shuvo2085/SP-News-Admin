import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      parent: { select: { name: true } },
      _count: { select: { articles: true, primaryArticles: true } },
    },
  });
  const parents = categories
    .filter((c) => !c.parent)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
        <p className="text-muted mt-1">{categories.length} categories</p>
      </div>
      <CategoryManager categories={categories} parents={parents} />
    </div>
  );
}
