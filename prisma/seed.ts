import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Top-level categories from thespnews.in, with a few sub-categories for the
// dropdown menus (India, West Bengal, World have sub-menus on the site).
const CATEGORIES: { name: string; children?: string[] }[] = [
  { name: "India", children: ["National", "Delhi", "Economy"] },
  { name: "West Bengal", children: ["Siliguri", "Kolkata", "North Bengal", "Darjeeling"] },
  { name: "World", children: ["Asia", "Americas", "Europe"] },
  { name: "Politics" },
  { name: "Business" },
  { name: "Technology" },
  { name: "Sports" },
  { name: "Entertainment" },
  { name: "Lifestyle" },
  { name: "Opinion" },
];

async function main() {
  console.log("Seeding SP News database...");

  // --- Users ---------------------------------------------------------------
  const adminPass = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@thespnews.in" },
    update: {},
    create: {
      name: "Sanjay",
      email: "admin@thespnews.in",
      passwordHash: adminPass,
      role: "ADMIN",
      bio: "Administrator",
    },
  });

  const editorial = await prisma.user.upsert({
    where: { email: "editorial@thespnews.in" },
    update: {},
    create: {
      name: "SP News Editorial",
      email: "editorial@thespnews.in",
      passwordHash: await bcrypt.hash("editor123", 10),
      role: "EDITOR",
      bio: "SP News Editorial Desk",
    },
  });

  // --- Categories (with sub-categories) ------------------------------------
  let order = 0;
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: { order: order },
      create: { name: cat.name, slug: slugify(cat.name), order: order },
    });
    order++;
    for (const child of cat.children ?? []) {
      await prisma.category.upsert({
        where: { slug: slugify(child) },
        update: { parentId: parent.id },
        create: { name: child, slug: slugify(child), parentId: parent.id, order: order },
      });
      order++;
    }
  }

  // --- A couple of sample articles so the dashboard isn't empty ------------
  const wb = await prisma.category.findUnique({ where: { slug: "west-bengal" } });
  const siliguri = await prisma.category.findUnique({ where: { slug: "siliguri" } });

  const sample = await prisma.article.upsert({
    where: { slug: "welcome-to-sp-news" },
    update: {},
    create: {
      title: "Welcome to Sanjay Pera News",
      slug: "welcome-to-sp-news",
      excerpt:
        "SP News brings you trusted local coverage from Siliguri and across West Bengal.",
      content:
        "<p>Sanjay Pera News (SP News) delivers breaking news, in-depth analysis, and trusted journalism across politics, business, sports, entertainment, and technology.</p>",
      status: "PUBLISHED",
      featured: true,
      readTime: 1,
      authorId: editorial.id,
      primaryCategoryId: wb?.id ?? null,
      publishedAt: new Date(),
      metaTitle: "Welcome to Sanjay Pera News",
      metaDescription: "Local news from Siliguri and West Bengal.",
      keywords: "siliguri, west bengal, news",
      categories: {
        connect: [wb, siliguri].filter(Boolean).map((c) => ({ id: (c as { id: string }).id })),
      },
    },
  });

  console.log("Seeded:", {
    admin: admin.email,
    editorial: editorial.email,
    categories: await prisma.category.count(),
    sampleArticle: sample.slug,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
