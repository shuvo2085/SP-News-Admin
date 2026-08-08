import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-brand/10 text-brand",
  EDITOR: "bg-accent/10 text-accent",
  AUTHOR: "bg-foreground/10 text-foreground/70",
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Users</h1>
          <p className="text-muted mt-1">{users.length} team members</p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2.5"
        >
          <UserPlus className="h-4 w-4" /> Create User
        </Link>
      </div>

      <div className="rounded-2xl bg-surface border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="font-medium px-5 py-3">Name</th>
              <th className="font-medium px-5 py-3">Email</th>
              <th className="font-medium px-5 py-3">Role</th>
              <th className="font-medium px-5 py-3">Articles</th>
              <th className="font-medium px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-8 w-8 rounded-full bg-accent/15 text-accent text-xs font-bold">
                      {u.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted">{u.email}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ROLE_STYLES[u.role] ?? ""
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">{u._count.articles}</td>
                <td className="px-5 py-3 text-muted">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
