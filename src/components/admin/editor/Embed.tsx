"use client";

import { Node } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { MessageSquare, Camera, Users, Video, Code2, Link2 } from "lucide-react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (attrs: { provider: string; url?: string; html?: string }) => ReturnType;
    };
  }
}

const ICONS: Record<string, typeof MessageSquare> = {
  twitter: MessageSquare,
  instagram: Camera,
  facebook: Users,
  youtube: Video,
  raw: Code2,
};

const LABELS: Record<string, string> = {
  twitter: "X / Twitter post",
  instagram: "Instagram post",
  facebook: "Facebook post",
  youtube: "YouTube video",
  raw: "Custom embed",
};

function EmbedView({ node }: NodeViewProps) {
  const { provider, url } = node.attrs as { provider: string; url: string };
  const Icon = ICONS[provider] ?? Link2;
  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        className="my-2 flex items-center gap-3 rounded-xl border border-border bg-foreground/[0.03] px-4 py-3"
      >
        <Icon className="h-5 w-5 text-accent" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{LABELS[provider] ?? "Embed"}</div>
          {url ? (
            <div className="text-xs text-muted truncate">{url}</div>
          ) : (
            <div className="text-xs text-muted">Custom embed code</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      provider: { default: "twitter" },
      url: { default: "" },
      html: { default: "" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div.post-embed",
        getAttrs: (el: HTMLElement) => ({
          provider: el.getAttribute("data-provider") || "raw",
          url: el.getAttribute("data-url") || "",
          html: el.getAttribute("data-html") || "",
        }),
      },
    ];
  },
  renderHTML({ node }) {
    const { provider, url, html } = node.attrs as Record<string, string>;
    const label = LABELS[provider] ?? "Embed";
    return [
      "div",
      {
        class: "post-embed",
        "data-provider": provider,
        "data-url": url,
        "data-html": html,
      },
      // Fallback link so the mobile app / preview always shows something tappable.
      url
        ? ["a", { href: url, class: "post-embed-link" }, `${label} →`]
        : ["span", { class: "post-embed-link" }, label],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },
  addCommands() {
    return {
      setEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
