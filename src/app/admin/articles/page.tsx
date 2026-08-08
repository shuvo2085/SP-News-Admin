import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { ArticleRowActions } from "@/components/admin/ArticleRowActions";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  PENDING: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ARCHIVED: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const TABS = [
  { label: "All", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafts", value: "DRAFT" },
  { label: "Pending", value: "PENDING" },
  { label: "Archived", value: "ARCHIVED" },
] as const;

export default async function ArticlesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q)
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
    ];

  const articles = await prisma.article.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true } },
      primaryCategory: { select: { name: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">All Articles</h1>
          <p className="text-muted mt-1">{articles.length} shown</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2.5"
        >
          <Plus className="h-4 w-4" /> Add New
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = (status ?? "") === t.value;
          return (
            <Link
              key={t.value}
              href={t.value ? `/admin/articles?status=${t.value}` : "/admin/articles"}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium border ${
                active
                  ? "bg-accent text-white border-accent"
                  : "border-border hover:bg-foreground/5"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
        <form className="ml-auto" action="/admin/articles">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search articles…"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
        </form>
      </div>

      <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="font-medium px-5 py-3">Title</th>
              <th className="font-medium px-5 py-3">Category</th>
              <th className="font-medium px-5 py-3">Author</th>
              <th className="font-medium px-5 py-3">Status</th>
              <th className="font-medium px-5 py-3">Updated</th>
              <th className="font-medium px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted">
                  No articles found.{" "}
                  <Link href="/admin/articles/new" className="text-accent hover:underline">
                    Write your first story →
                  </Link>
                </td>
              </tr>
            )}
            {articles.map((a) => (
              <tr
                key={a.id}
                className="border-b border-border last:border-0 hover:bg-foreground/[0.02]"
              >
                <td className="px-5 py-3 max-w-sm">
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="font-medium hover:text-accent line-clamp-1"
                  >
                    {a.title || "Untitled"}
                  </Link>
                  <div className="flex gap-1.5 mt-1">
                    {a.featured && (
                      <span className="text-[10px] rounded bg-accent/10 text-accent px-1.5 py-0.5 font-semibold">
                        FEATURED
                      </span>
                    )}
                    {a.breaking && (
                      <span className="text-[10px] rounded bg-brand/10 text-brand px-1.5 py-0.5 font-semibold">
                        BREAKING
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">
                  {a.primaryCategory?.name ?? "—"}
                </td>
                <td className="px-5 py-3 text-muted">{a.author.name}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[a.status] ?? ""
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {timeAgo(a.updatedAt)}
                </td>
                <td className="px-5 py-3">
                  <ArticleRowActions id={a.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
