import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { getCategoryOptions, getAuthorOptions } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const [categories, authors] = await Promise.all([
    getCategoryOptions(),
    getAuthorOptions(),
  ]);
  return <ArticleEditor categories={categories} authors={authors} />;
}
