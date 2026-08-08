"use client";

import { Node } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { useRef } from "react";
import { Plus, X } from "lucide-react";

type Img = { src: string; alt?: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gallery: {
      setGallery: (images: Img[]) => ReturnType;
    };
  }
}

async function uploadFile(file: File): Promise<Img | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  const m = await res.json();
  return { src: m.url, alt: m.alt ?? "" };
}

function GalleryView({ node, updateAttributes, selected }: NodeViewProps) {
  const images: Img[] = node.attrs.images ?? [];
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploaded: Img[] = [];
    for (const f of Array.from(files)) {
      const img = await uploadFile(f);
      if (img) uploaded.push(img);
    }
    updateAttributes({ images: [...images, ...uploaded] });
  };

  const remove = (i: number) =>
    updateAttributes({ images: images.filter((_, idx) => idx !== i) });

  return (
    <NodeViewWrapper
      className="post-gallery-editor"
      style={{ outline: selected ? "2px solid var(--accent)" : "none", borderRadius: 8, padding: 4 }}
    >
      <div className="post-gallery" data-cols={Math.min(images.length || 1, 3)}>
        {images.map((img, i) => (
          <div key={i} style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt ?? ""} />
            <button
              type="button"
              contentEditable={false}
              onClick={() => remove(i)}
              className="absolute top-1 right-1 grid place-items-center h-6 w-6 rounded-full bg-black/60 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div contentEditable={false} className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-foreground/5"
        >
          <Plus className="h-4 w-4" /> Add images
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const Gallery = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      images: {
        default: [] as Img[],
        parseHTML: (el: HTMLElement) => {
          const imgs = Array.from(el.querySelectorAll("img"));
          return imgs.map((i) => ({
            src: i.getAttribute("src") ?? "",
            alt: i.getAttribute("alt") ?? "",
          }));
        },
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div.post-gallery" }];
  },
  renderHTML({ node }) {
    const images: Img[] = node.attrs.images ?? [];
    return [
      "div",
      { class: "post-gallery", "data-cols": String(Math.min(images.length || 1, 3)) },
      ...images.map((img) => ["img", { src: img.src, alt: img.alt ?? "" }]),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(GalleryView);
  },
  addCommands() {
    return {
      setGallery:
        (images) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { images } }),
    };
  },
});
