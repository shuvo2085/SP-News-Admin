"use client";

import { Smartphone } from "lucide-react";

/** Renders the post the way it appears in the reader app — inside a phone frame. */
export function PostPreview({
  title,
  excerpt,
  category,
  author,
  image,
  content,
}: {
  title: string;
  excerpt: string;
  category?: string | null;
  author: string;
  image?: string | null;
  content: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted">
        <Smartphone className="h-3.5 w-3.5" /> Live preview — how it looks in the app
      </div>
      <div className="w-[380px] max-w-full rounded-[2rem] border-8 border-neutral-800 bg-white shadow-xl overflow-hidden">
        {/* brand header */}
        <div className="h-11 bg-white border-b border-neutral-200 flex items-center px-3">
          <div className="flex flex-col items-center leading-none">
            <div className="flex rounded overflow-hidden ring-1 ring-brand">
              <span className="bg-brand text-white font-extrabold px-1 py-0.5 text-[11px]">संजय</span>
              <span className="bg-white text-neutral-700 font-extrabold px-1 py-0.5 text-[11px]">पेड़ा</span>
            </div>
            <span className="text-[7px] font-black tracking-[0.3em] text-neutral-500">NEWS</span>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-40 bg-neutral-200 grid place-items-center text-neutral-400 text-sm">
              No featured image
            </div>
          )}
          <div className="p-4 text-neutral-900">
            {category ? (
              <span className="inline-block bg-brand text-white text-[11px] font-bold px-2 py-0.5 rounded mb-2">
                {category}
              </span>
            ) : null}
            <h1 className="text-2xl font-black leading-tight">
              {title || "Your headline appears here"}
            </h1>
            <p className="text-xs text-neutral-500 mt-2">By {author}</p>
            {excerpt ? (
              <p className="text-[15px] font-semibold mt-3 leading-relaxed">{excerpt}</p>
            ) : null}
            <div
              className="article-body mt-3 text-[15px] text-neutral-900"
              // Content is authored in our own admin editor (trusted), rendered for preview.
              dangerouslySetInnerHTML={{ __html: content || "<p style='color:#9ca3af'>Start writing to see your story here…</p>" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
