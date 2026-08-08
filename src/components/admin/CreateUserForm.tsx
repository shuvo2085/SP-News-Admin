"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "AUTHOR",
    bio: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to create user");
    }
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <form
      onSubmit={submit}
      className="max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-sm space-y-4"
    >
      <div>
        <label className="block text-sm font-semibold mb-1.5">Full name</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          className={inputCls}
          minLength={6}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Role</label>
        <select
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          className={inputCls}
        >
          <option value="AUTHOR">Author</option>
          <option value="EDITOR">Editor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Bio (optional)</label>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          className={inputCls}
        />
      </div>
      {error && <p className="text-brand text-sm">{error}</p>}
      <button
        disabled={busy}
        className="w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create User"}
      </button>
    </form>
  );
}
