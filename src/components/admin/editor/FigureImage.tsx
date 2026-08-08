"use client";

import { Node } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, Maximize2 } from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figureImage: {
      setFigureImage: (attrs: {
        src: string;
        alt?: string;
        caption?: string;
        align?: string;
      }) => ReturnType;
    };
  }
}

function FigureView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, caption, align } = node.attrs as {
    src: string;
    alt: string;
    caption: string;
    align: string;
  };

  const alignBtn = (value: string, Icon: typeof AlignLeft, title: string) => (
    <button
      type="button"
      title={title}
      onClick={() => updateAttributes({ align: value })}
      className={`grid place-items-center h-7 w-7 rounded ${
        align === value ? "bg-accent text-white" : "bg-black/5 hover:bg-black/10"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <NodeViewWrapper
      className="post-figure"
      data-align={align}
      style={{ outline: selected ? "2px solid var(--accent)" : "none", borderRadius: 8 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
      <figcaption>
        <input
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Add a caption…"
          className="w-full bg-transparent text-center text-sm text-muted outline-none"
        />
      </figcaption>
      {selected && (
        <div
          contentEditable={false}
          className="mt-1 flex items-center justify-center gap-1"
        >
          {alignBtn("left", AlignLeft, "Align left")}
          {alignBtn("center", AlignCenter, "Align center")}
          {alignBtn("right", AlignRight, "Align right")}
          {alignBtn("full", Maximize2, "Full width")}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      align: { default: "center" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "figure.post-figure",
        getAttrs: (el: HTMLElement) => {
          const img = el.querySelector("img");
          const cap = el.querySelector("figcaption");
          return {
            src: img?.getAttribute("src") ?? null,
            alt: img?.getAttribute("alt") ?? "",
            caption: cap?.textContent ?? "",
            align: el.getAttribute("data-align") ?? "center",
          };
        },
      },
    ];
  },
  renderHTML({ node }) {
    const { src, alt, caption, align } = node.attrs as Record<string, string>;
    const children: (string | (string | Record<string, string>)[])[] = [
      ["img", { src, alt }],
    ];
    if (caption) children.push(["figcaption", {}, caption]);
    return ["figure", { class: "post-figure", "data-align": align }, ...children];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FigureView);
  },
  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
