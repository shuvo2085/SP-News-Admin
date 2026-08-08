"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Youtube } from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Quote, List, ListOrdered, Link as LinkIcon, Unlink, ImagePlus,
  Images as GalleryIcon, Video, RemoveFormatting, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, Minus, Table as TableIcon, Megaphone,
  MousePointerClick, Columns2, Baseline, Highlighter, Code2, X,
} from "lucide-react";

import { FontSize, Callout, Button as ButtonNode, Columns, Column } from "./editor/extensions";
import { FigureImage } from "./editor/FigureImage";
import { Gallery } from "./editor/Gallery";
import { Embed } from "./editor/Embed";

function Btn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid place-items-center h-8 w-8 rounded-md text-foreground/80 hover:bg-foreground/10 ${
        active ? "bg-accent/15 text-accent" : ""
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" />;

async function uploadFile(file: File): Promise<{ url: string; alt?: string } | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) return null;
  return res.json();
}

function Toolbar({ editor }: { editor: Editor }) {
  const imgRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [embedOpen, setEmbedOpen] = useState(false);

  const blockValue = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : editor.isActive("heading", { level: 4 })
    ? "h4"
    : "p";

  const setBlock = (v: string) => {
    const c = editor.chain().focus();
    if (v === "p") c.setParagraph().run();
    else c.toggleHeading({ level: Number(v[1]) as 2 | 3 | 4 }).run();
  };

  const fontSizes = [
    { label: "Small", value: "14px" },
    { label: "Normal", value: "" },
    { label: "Large", value: "20px" },
    { label: "X-Large", value: "26px" },
    { label: "Huge", value: "34px" },
  ];

  const addLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "")
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const m = await uploadFile(file);
    if (m) editor.chain().focus().setFigureImage({ src: m.url, alt: m.alt ?? "" }).run();
  };

  const onPickGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = "";
    if (!files?.length) return;
    const imgs: { src: string; alt?: string }[] = [];
    for (const f of Array.from(files)) {
      const m = await uploadFile(f);
      if (m) imgs.push({ src: m.url, alt: m.alt ?? "" });
    }
    if (imgs.length) editor.chain().focus().setGallery(imgs).run();
  };

  const addYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (url) editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  };

  const addButton = () => {
    const label = window.prompt("Button text", "Learn more");
    if (label === null) return;
    const href = window.prompt("Button link URL", "https://") ?? "#";
    editor.chain().focus().setButton({ label: label || "Button", href }).run();
  };

  return (
    <div className="border-b border-border p-2 space-y-1.5">
      {/* Row 1: block + text marks + color */}
      <div className="flex flex-wrap items-center gap-1">
        <select
          value={blockValue}
          onChange={(e) => setBlock(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          title="Text style"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        <select
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontSize(v).run();
            else editor.chain().focus().unsetFontSize().run();
            e.target.selectedIndex = 0;
          }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          title="Font size"
        >
          <option value="__">Size</option>
          {fontSizes.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        <Divider />
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
        <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>

        <Divider />
        {/* Text color */}
        <label className="grid place-items-center h-8 w-8 rounded-md hover:bg-foreground/10 cursor-pointer relative" title="Text color">
          <Baseline className="h-4 w-4" />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        {/* Highlight */}
        <label className="grid place-items-center h-8 w-8 rounded-md hover:bg-foreground/10 cursor-pointer relative" title="Highlight">
          <Highlighter className="h-4 w-4" />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          />
        </label>
      </div>

      {/* Row 2: alignment + lists + blocks */}
      <div className="flex flex-wrap items-center gap-1">
        <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
        <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify className="h-4 w-4" /></Btn>

        <Divider />
        <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>

        <Divider />
        <Btn title="Link" active={editor.isActive("link")} onClick={addLink}><LinkIcon className="h-4 w-4" /></Btn>
        <Btn title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}><Unlink className="h-4 w-4" /></Btn>
        <Btn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting className="h-4 w-4" /></Btn>
      </div>

      {/* Row 3: media + layout blocks */}
      <div className="flex flex-wrap items-center gap-1">
        <Btn title="Image" onClick={() => imgRef.current?.click()}><ImagePlus className="h-4 w-4" /></Btn>
        <Btn title="Gallery" onClick={() => galleryRef.current?.click()}><GalleryIcon className="h-4 w-4" /></Btn>
        <Btn title="YouTube video" onClick={addYoutube}><Video className="h-4 w-4" /></Btn>
        <Btn title="Embed (X, Instagram, Facebook, code)" onClick={() => setEmbedOpen(true)}><Code2 className="h-4 w-4" /></Btn>

        <Divider />
        <Btn title="Callout box" onClick={() => editor.chain().focus().setCallout("info").run()}><Megaphone className="h-4 w-4" /></Btn>
        <Btn title="Button" onClick={addButton}><MousePointerClick className="h-4 w-4" /></Btn>
        <Btn title="Two columns" onClick={() => editor.chain().focus().setColumns().run()}><Columns2 className="h-4 w-4" /></Btn>
        <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Btn>
      </div>

      <input ref={imgRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={onPickGallery} />

      {embedOpen && <EmbedModal editor={editor} onClose={() => setEmbedOpen(false)} />}
    </div>
  );
}

function EmbedModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [provider, setProvider] = useState("twitter");
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");

  const insert = () => {
    if (provider === "raw") {
      if (!html.trim()) return;
      editor.chain().focus().setEmbed({ provider: "raw", html }).run();
    } else {
      if (!url.trim()) return;
      editor.chain().focus().setEmbed({ provider, url }).run();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Insert embed</h3>
          <button onClick={onClose} className="grid place-items-center h-8 w-8 rounded-md hover:bg-foreground/10"><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-sm font-semibold mb-1.5">Platform</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm mb-3">
          <option value="twitter">X / Twitter</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="raw">Custom embed code</option>
        </select>
        {provider === "raw" ? (
          <>
            <label className="block text-sm font-semibold mb-1.5">Embed / iframe code</label>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={4} placeholder="<iframe …></iframe>" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono" />
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold mb-1.5">Post / video URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
          </>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-foreground/5">Cancel</button>
          <button onClick={insert} className="rounded-lg bg-accent hover:bg-accent-dark text-white px-4 py-2 text-sm font-semibold">Insert</button>
        </div>
      </div>
    </div>
  );
}

export function RichText({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      FigureImage,
      Gallery,
      Embed,
      Callout,
      ButtonNode,
      Columns,
      Column,
      Placeholder.configure({ placeholder: "Write your story… use the toolbar to design it" }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "article-body px-4 py-3" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-muted">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
