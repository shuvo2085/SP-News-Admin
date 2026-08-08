"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud, Copy, Check } from "lucide-react";

type Media = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export function MediaLibrary() {
  const [items, setItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch("/api/media")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/upload", { method: "POST", body: fd });
    }
    setUploading(false);
    load();
  };

  const copy = (url: string) => {
    const full = window.location.origin + url;
    navigator.clipboard?.writeText(full);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface py-12 px-4 text-center cursor-pointer hover:bg-foreground/[0.02]"
      >
        <UploadCloud className="h-8 w-8 text-muted" />
        <span className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop images here or click to upload"}
        </span>
        <span className="text-[11px] text-muted">
          JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, HEIC
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </label>

      {items.length === 0 ? (
        <p className="text-muted text-center py-8">No media yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-surface overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.filename}
                className="w-full h-32 object-cover bg-foreground/5"
              />
              <div className="p-2">
                <div className="text-xs font-medium truncate" title={m.filename}>
                  {m.filename}
                </div>
                <div className="text-[10px] text-muted">
                  {(m.size / 1024).toFixed(0)} KB
                </div>
                <button
                  onClick={() => copy(m.url)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                >
                  {copied === m.url ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
