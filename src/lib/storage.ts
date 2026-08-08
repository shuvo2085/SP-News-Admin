import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { slugify } from "@/lib/slug";

export type SavedFile = {
  url: string;
  filename: string; // original filename
  mimeType: string;
  size: number;
};

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

/** True when Supabase Storage is configured (production). */
export function usingSupabaseStorage(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function buildStorageName(originalName: string, mimeType: string): string {
  const ext = path.extname(originalName) || "." + (mimeType.split("/")[1] ?? "bin");
  const base = slugify(path.basename(originalName, path.extname(originalName))) || "image";
  return `${Date.now()}-${base}${ext}`;
}

/**
 * Persists an uploaded file and returns its public URL + metadata.
 * - Production: uploads to a public Supabase Storage bucket (survives redeploys).
 * - Local dev: writes to /public/uploads on disk.
 */
export async function saveUpload(file: File): Promise<SavedFile> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const storageName = buildStorageName(file.name, file.type);

  if (usingSupabaseStorage()) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storageName, bytes, {
        contentType: file.type,
        upsert: false,
      });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageName);
    return {
      url: data.publicUrl,
      filename: file.name,
      mimeType: file.type,
      size: bytes.length,
    };
  }

  // Local dev fallback → filesystem.
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageName), bytes);
  return {
    url: `/uploads/${storageName}`,
    filename: file.name,
    mimeType: file.type,
    size: bytes.length,
  };
}
