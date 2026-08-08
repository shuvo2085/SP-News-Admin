import { Extension, Node, mergeAttributes } from "@tiptap/core";

/* ------------------------------------------------------------------ */
/* Font size — adds a fontSize attribute to the textStyle mark.        */
/* ------------------------------------------------------------------ */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    callout: { setCallout: (variant?: string) => ReturnType };
    button: { setButton: (attrs: { href: string; label: string }) => ReturnType };
    columns: { setColumns: () => ReturnType };
  }
}

export const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: { fontSize?: string | null }) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Callout — a highlighted box (info / warning / success / tip).       */
/* ------------------------------------------------------------------ */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-variant") || "info",
        renderHTML: (attrs: { variant: string }) => ({ "data-variant": attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div.post-callout" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "post-callout" }), 0];
  },
  addCommands() {
    return {
      setCallout:
        (variant = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Button — a call-to-action link styled as a button.                  */
/* ------------------------------------------------------------------ */
export const Button = Node.create({
  name: "button",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      href: { default: "#" },
      label: { default: "Learn more" },
    };
  },
  parseHTML() {
    return [
      {
        tag: "a.post-button",
        getAttrs: (el: HTMLElement) => ({
          href: el.getAttribute("href") || "#",
          label: el.textContent || "Button",
        }),
      },
    ];
  },
  renderHTML({ node }) {
    return [
      "div",
      { class: "post-button-wrap" },
      [
        "a",
        { class: "post-button", href: node.attrs.href as string },
        node.attrs.label as string,
      ],
    ];
  },
  addCommands() {
    return {
      setButton:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

/* ------------------------------------------------------------------ */
/* Columns — a two-column layout (each column holds block content).    */
/* ------------------------------------------------------------------ */
export const Column = Node.create({
  name: "column",
  content: "block+",
  isolating: true,
  parseHTML() {
    return [{ tag: "div.post-col" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "post-col" }), 0];
  },
});

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column column",
  parseHTML() {
    return [{ tag: "div.post-columns" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "post-columns" }), 0];
  },
  addCommands() {
    return {
      setColumns:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [
              { type: "column", content: [{ type: "paragraph" }] },
              { type: "column", content: [{ type: "paragraph" }] },
            ],
          }),
    };
  },
});
