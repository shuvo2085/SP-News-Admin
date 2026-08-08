"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichText } from "./RichText";
import { PostPreview } from "./PostPreview";
import { X, UploadCloud, Check, Loader2, Pencil, Eye } from "lucide-react";

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentName?: string | null;
};
export type AuthorOption = { id: string; name: string };
export type MediaOption = { id: string; url: string; filename: string };

export type ArticleData = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  breaking: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  authorId: string;
  primaryCategoryId: string | null;
  featuredImageId: string | null;
  featuredImage: { id: string; url: string } | null;
  categories: { id: string }[];
  tags: { name: string }[];
};

const STATUS = ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"] as const;

export function ArticleEditor({
  categories,
  authors,
  article,
}: {
  categories: CategoryOption[];
  authors: AuthorOption[];
  article?: ArticleData;
}) {
  const router = useRouter();

  const [id, setId] = useState<string | null>(article?.id ?? null);
  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [status, setStatus] = useState<ArticleData["status"]>(
    article?.status ?? "DRAFT"
  );
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [breaking, setBreaking] = useState(article?.breaking ?? false);
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    article?.metaDescription ?? ""
  );
  const [keywords, setKeywords] = useState(article?.keywords ?? "");
  const [authorId, setAuthorId] = useState(
    article?.authorId ?? authors[0]?.id ?? ""
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    article?.categories.map((c) => c.id) ?? []
  );
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(
    article?.primaryCategoryId ?? null
  );
  const [tags, setTags] = useState<string[]>(
    article?.tags.map((t) => t.name) ?? []
  );
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState<{
    id: string;
    url: string;
  } | null>(article?.featuredImage ?? null);

  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [library, setLibrary] = useState<MediaOption[]>([]);
  const dirty = useRef(false);
  const saving = useRef(false);

  // Load media library for the "choose from library" dropdown.
  useEffect(() => {
    fetch("/api/media")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setLibrary(d.items ?? []))
      .catch(() => {});
  }, []);

  const buildPayload = useCallback(
    (overrides?: Record<string, unknown>) => ({
      title,
      excerpt,
      content,
      status,
      featured,
      breaking,
      metaTitle,
      metaDescription,
      keywords,
      authorId,
      primaryCategoryId,
      categoryIds,
      tags,
      featuredImageId: featuredImage?.id ?? null,
      ...overrides,
    }),
    [
      title, excerpt, content, status, featured, breaking, metaTitle,
      metaDescription, keywords, authorId, primaryCategoryId, categoryIds,
      tags, featuredImage,
    ]
  );

  const save = useCallback(
    async (overrides?: Record<string, unknown>): Promise<string | null> => {
      if (saving.current) return id;
      // Don't create empty drafts.
      if (!id && !title.trim() && !content.trim()) return null;
      saving.current = true;
      setSaveState("saving");
      try {
        const payload = buildPayload(overrides);
        let currentId = id;
        if (currentId) {
          await fetch(`/api/articles/${currentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          const res = await fetch("/api/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const created = await res.json();
            currentId = created.id;
            setId(created.id);
            window.history.replaceState(null, "", `/admin/articles/${created.id}`);
          }
        }
        dirty.current = false;
        setSaveState("saved");
        return currentId;
      } catch {
        setSaveState("idle");
        return id;
      } finally {
        saving.current = false;
      }
    },
    [id, title, content, buildPayload]
  );

  // Debounced autosave.
  useEffect(() => {
    dirty.current = true;
    setSaveState("idle");
    const t = setTimeout(() => {
      if (dirty.current) save();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title, excerpt, content, featured, breaking, metaTitle, metaDescription,
    keywords, authorId, primaryCategoryId, categoryIds, tags, featuredImage,
  ]);

  const publish = async () => {
    setStatus("PUBLISHED");
    const savedId = await save({ status: "PUBLISHED" });
    if (savedId) router.push("/admin/articles");
  };

  const saveDraft = async () => {
    setStatus("DRAFT");
    await save({ status: "DRAFT" });
  };

  // --- category helpers ---
  const addCategory = (cid: string) => {
    if (!cid || categoryIds.includes(cid)) return;
    setCategoryIds((prev) => [...prev, cid]);
    if (!primaryCategoryId) setPrimaryCategoryId(cid);
  };
  const removeCategory = (cid: string) => {
    setCategoryIds((prev) => prev.filter((x) => x !== cid));
    if (primaryCategoryId === cid) setPrimaryCategoryId(null);
  };
  const catName = (cid: string) =>
    categories.find((c) => c.id === cid)?.name ?? cid;

  // --- tag helpers ---
  const commitTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) setTags((p) => [...p, v]);
    setTagInput("");
  };

  // --- featured image upload ---
  const uploadFeatured = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const m = await res.json();
      setFeaturedImage({ id: m.id, url: m.url });
      setLibrary((prev) => [m, ...prev]);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40";
  const card = "rounded-2xl bg-surface border border-border p-5 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {article ? "Edit Article" : "Add New Article"}
          </h1>
          <p className="text-muted mt-1 flex items-center gap-2">
            Auto-saves as draft while you write
            {saveState === "saving" && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" /> saving…
              </span>
            )}
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" /> saved
              </span>
            )}
          </p>
        </div>
        <Link href="/admin/articles" className="text-sm text-accent hover:underline whitespace-nowrap">
          ← Back to Articles
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <div className={card}>
            <label className="block text-sm font-semibold mb-1.5">Title</label>
            <input
              value={title}
              maxLength={300}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline goes here"
              className={`${inputCls} text-lg font-semibold`}
            />
            <div className="text-right text-xs text-muted mt-1">
              {title.length} / 300
            </div>

            <label className="block text-sm font-semibold mb-1.5 mt-3">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              maxLength={500}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for cards and SEO"
              rows={3}
              className={inputCls}
            />
            <div className="text-right text-xs text-muted mt-1">
              {excerpt.length} / 500
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold">Content</label>
              <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                <button
                  onClick={() => setPreview(false)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${
                    !preview ? "bg-accent text-white" : "hover:bg-foreground/5"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setPreview(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${
                    preview ? "bg-accent text-white" : "hover:bg-foreground/5"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
              </div>
            </div>
            {preview ? (
              <PostPreview
                title={title}
                excerpt={excerpt}
                category={primaryCategoryId ? catName(primaryCategoryId) : null}
                author={authors.find((a) => a.id === authorId)?.name ?? "SP News Editorial"}
                image={featuredImage?.url}
                content={content}
              />
            ) : (
              <RichText value={content} onChange={setContent} />
            )}
            <p className="mt-2 text-xs text-muted">
              Design your post with the toolbar — styles, colors, images, galleries, embeds, callouts, buttons, columns &amp; tables.
            </p>
          </div>

          <div className={card}>
            <h2 className="text-lg font-bold mb-4">SEO</h2>
            <label className="block text-sm font-semibold mb-1.5">Meta Title</label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={inputCls}
            />
            <label className="block text-sm font-semibold mb-1.5 mt-3">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              className={inputCls}
            />
            <label className="block text-sm font-semibold mb-1.5 mt-3">
              Keywords
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="politics, india, election"
              className={inputCls}
            />
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Publish */}
          <div className={card}>
            <h2 className="text-lg font-bold mb-3">Publish</h2>
            <label className="block text-sm font-semibold mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleData["status"])}
              className={inputCls}
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={saveDraft}
              className="mt-3 w-full rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold py-2.5"
            >
              Save Draft
            </button>
            <button
              onClick={publish}
              className="mt-2 w-full rounded-lg border border-border hover:bg-foreground/5 font-semibold py-2.5"
            >
              Publish Now
            </button>
          </div>

          {/* Organization */}
          <div className={card}>
            <h2 className="text-lg font-bold mb-1">Organization</h2>

            <label className="block text-sm font-semibold mt-3">Categories</label>
            <p className="text-xs text-muted mb-2">
              Select one or more. Click a chip to mark it as primary (used for the article URL).
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {categoryIds.map((cid) => {
                const isPrimary = primaryCategoryId === cid;
                return (
                  <span
                    key={cid}
                    onClick={() => setPrimaryCategoryId(cid)}
                    className={`inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-1.5 py-1 text-xs font-medium cursor-pointer border ${
                      isPrimary
                        ? "bg-brand/10 border-brand text-brand"
                        : "bg-foreground/5 border-border"
                    }`}
                    title="Click to make primary"
                  >
                    {isPrimary && <span className="font-bold">PRIMARY</span>}
                    {catName(cid)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(cid);
                      }}
                      className="grid place-items-center h-4 w-4 rounded-full hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="relative">
              <select
                value=""
                onChange={(e) => addCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">+ Add category</option>
                {categories
                  .filter((c) => !categoryIds.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                    </option>
                  ))}
              </select>
            </div>

            <label className="block text-sm font-semibold mt-4">Tags</label>
            <p className="text-xs text-muted mb-2">
              Add keywords to help readers find this story.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-1.5 py-1 text-xs font-medium bg-foreground/5 border border-border"
                >
                  {t}
                  <button
                    onClick={() => setTags((p) => p.filter((x) => x !== t))}
                    className="grid place-items-center h-4 w-4 rounded-full hover:bg-black/10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitTag();
                }
              }}
              onBlur={commitTag}
              placeholder="Type a keyword and press Enter"
              className={inputCls}
            />

            <label className="block text-sm font-semibold mt-4 mb-1.5">
              Author
            </label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className={inputCls}
            >
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 mt-4 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Featured story
            </label>
            <label className="flex items-center gap-2 mt-2 text-sm">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              Breaking news
            </label>
          </div>

          {/* Featured Image */}
          <div className={card}>
            <h2 className="text-lg font-bold mb-1">Featured Image</h2>
            {featuredImage ? (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImage.url}
                  alt="Featured"
                  className="w-full rounded-lg border border-border object-cover max-h-56"
                />
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="mt-2 text-xs text-brand hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted mt-1">No image selected</p>
            )}

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) uploadFeatured(f);
              }}
              className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-8 px-4 text-center cursor-pointer hover:bg-foreground/[0.02]"
            >
              <UploadCloud className="h-6 w-6 text-muted" />
              <span className="text-sm text-muted">
                Upload featured image — drag &amp; drop or click
              </span>
              <span className="text-[11px] text-muted">
                JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC
              </span>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFeatured(f);
                }}
              />
            </label>

            <label className="block text-sm font-semibold mt-4 mb-1.5">
              Or choose from library
            </label>
            <select
              value={featuredImage?.id ?? ""}
              onChange={(e) => {
                const m = library.find((x) => x.id === e.target.value);
                setFeaturedImage(m ? { id: m.id, url: m.url } : null);
              }}
              className={inputCls}
            >
              <option value="">None</option>
              {library.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.filename}
                </option>
              ))}
            </select>
            <Link
              href="/admin/media"
              className="mt-2 inline-block text-sm text-accent hover:underline"
            >
              Open Media Library →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
