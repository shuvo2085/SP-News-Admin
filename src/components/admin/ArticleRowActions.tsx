"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export function ArticleRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const del = async () => {
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert("Delete failed");
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/articles/${id}`}
        className="grid place-items-center h-8 w-8 rounded-md hover:bg-foreground/10 text-foreground/70"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        onClick={del}
        disabled={busy}
        className="grid place-items-center h-8 w-8 rounded-md hover:bg-brand/10 text-brand disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
