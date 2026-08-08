import { MediaLibrary } from "@/components/admin/MediaLibrary";

export const dynamic = "force-dynamic";

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Media Library</h1>
        <p className="text-muted mt-1">Upload and manage images for your stories</p>
      </div>
      <MediaLibrary />
    </div>
  );
}
