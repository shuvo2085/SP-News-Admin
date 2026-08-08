export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // strip punctuation
    .replace(/[\s_-]+/g, "-") // collapse whitespace/underscores to single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/** Rough read-time in minutes from HTML content (200 wpm). */
export function readTimeFromHtml(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
