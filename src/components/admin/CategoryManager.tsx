"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

type Cat = {
  id: string;
  name: string;
  slug: string;
  parent: { name: string } | null;
  _count: { articles: number; primaryArticles: number };
};

export function CategoryManager({
  categories,
  parents,
}: {
  categories: Cat[];
  parents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setParentId("");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to add category");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Delete failed");
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40";
  const card = "rounded-2xl bg-surface border border-border p-5 shadow-sm";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className={`${card} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="font-medium px-4 py-3">Name</th>
                <th className="font-medium px-4 py-3">Parent</th>
                <th className="font-medium px-4 py-3">Slug</th>
                <th className="font-medium px-4 py-3">Articles</th>
                <th className="font-medium px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.parent?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 text-muted">{c._count.primaryArticles}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => del(c.id)}
                      className="grid place-items-center h-8 w-8 rounded-md hover:bg-brand/10 text-brand ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <form onSubmit={add} className={card}>
          <h2 className="text-lg font-bold mb-3">Add Category</h2>
          <label className="block text-sm font-semibold mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Health"
            className={inputCls}
            required
          />
          <label className="block text-sm font-semibold mb-1.5 mt-3">
            Parent (optional)
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputCls}
          >
            <option value="">None (top-level)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {error && <p className="text-brand text-sm mt-2">{error}</p>}
          <button
            disabled={busy}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> {busy ? "Adding…" : "Add Category"}
          </button>
        </form>
      </div>
    </div>
  );
}
