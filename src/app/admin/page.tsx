import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  DRAFT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  PENDING: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ARCHIVED: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 shadow-sm">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-2 text-4xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [
    published,
    drafts,
    pending,
    users,
    categories,
    media,
    pendingComments,
    total,
    recent,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.category.count(),
    prisma.media.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.article.count(),
    prisma.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { author: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-muted mt-1">Overview of your news platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Published Articles" value={published} color="text-accent" />
        <StatCard label="Drafts" value={drafts} color="text-amber-500" />
        <StatCard label="Pending Review" value={pending} color="text-orange-500" />
        <StatCard label="Total Users" value={users} color="text-sky-500" />
        <StatCard label="Categories" value={categories} color="text-purple-500" />
        <StatCard label="Media Files" value={media} color="text-green-500" />
        <StatCard label="Pending Comments" value={pendingComments} color="text-red-500" />
        <StatCard label="Total Articles" value={total} color="text-foreground" />
      </div>

      <div className="rounded-2xl bg-surface border border-border shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold">Recent Articles</h2>
          <Link
            href="/admin/articles"
            className="text-sm text-accent hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="font-medium px-5 py-3">Title</th>
                <th className="font-medium px-5 py-3">Author</th>
                <th className="font-medium px-5 py-3">Status</th>
                <th className="font-medium px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted">
                    No articles yet.{" "}
                    <Link href="/admin/articles/new" className="text-accent hover:underline">
                      Write your first story →
                    </Link>
                  </td>
                </tr>
              )}
              {recent.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-medium hover:text-accent line-clamp-1"
                    >
                      {a.title || "Untitled"}
                    </Link>
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
                  <td className="px-5 py-3 text-muted">{timeAgo(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
