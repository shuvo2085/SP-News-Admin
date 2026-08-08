-- ============================================================
--  Sanjay Pera News — full Supabase setup (run ONCE)
--  Paste into Supabase -> SQL Editor -> Run.
--  Creates all tables + relationships + indexes, seeds the
--  categories, the admin/editorial logins and a sample article,
--  and baselines Prisma so the Render deploy is a no-op.
--  Safe to re-run (guards + ON CONFLICT).
-- ============================================================
BEGIN;

-- ---------- Enums ----------
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN','EDITOR','AUTHOR'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT','PENDING','PUBLISHED','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CommentStatus" AS ENUM ('PENDING','APPROVED','SPAM'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- Tables ----------
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AUTHOR',
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "breaking" BOOLEAN NOT NULL DEFAULT false,
    "readTime" INTEGER NOT NULL DEFAULT 1,
    "views" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "authorId" TEXT NOT NULL,
    "featuredImageId" TEXT,
    "primaryCategoryId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "_ArticleCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleCategories_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE IF NOT EXISTS "_ArticleTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- ---------- Indexes ----------
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");
CREATE INDEX IF NOT EXISTS "Article_status_idx" ON "Article"("status");
CREATE INDEX IF NOT EXISTS "Article_primaryCategoryId_idx" ON "Article"("primaryCategoryId");
CREATE INDEX IF NOT EXISTS "Article_publishedAt_idx" ON "Article"("publishedAt");
CREATE INDEX IF NOT EXISTS "Comment_articleId_idx" ON "Comment"("articleId");
CREATE INDEX IF NOT EXISTS "Comment_status_idx" ON "Comment"("status");
CREATE INDEX IF NOT EXISTS "_ArticleCategories_B_index" ON "_ArticleCategories"("B");
CREATE INDEX IF NOT EXISTS "_ArticleTags_B_index" ON "_ArticleTags"("B");

-- ---------- Foreign keys ----------
DO $$ BEGIN ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Article" ADD CONSTRAINT "Article_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Article" ADD CONSTRAINT "Article_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "_ArticleCategories" ADD CONSTRAINT "_ArticleCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "_ArticleCategories" ADD CONSTRAINT "_ArticleCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "_ArticleTags" ADD CONSTRAINT "_ArticleTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "_ArticleTags" ADD CONSTRAINT "_ArticleTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- Seed: categories (parents then children) ----------
INSERT INTO "Category" ("id","name","slug","description","order","parentId","createdAt","updatedAt") VALUES
  ('cat-india','India','india',NULL,0,NULL,now(),now()),
  ('cat-national','National','national',NULL,1,'cat-india',now(),now()),
  ('cat-delhi','Delhi','delhi',NULL,2,'cat-india',now(),now()),
  ('cat-economy','Economy','economy',NULL,3,'cat-india',now(),now()),
  ('cat-west-bengal','West Bengal','west-bengal',NULL,4,NULL,now(),now()),
  ('cat-siliguri','Siliguri','siliguri',NULL,5,'cat-west-bengal',now(),now()),
  ('cat-kolkata','Kolkata','kolkata',NULL,6,'cat-west-bengal',now(),now()),
  ('cat-north-bengal','North Bengal','north-bengal',NULL,7,'cat-west-bengal',now(),now()),
  ('cat-darjeeling','Darjeeling','darjeeling',NULL,8,'cat-west-bengal',now(),now()),
  ('cat-world','World','world',NULL,9,NULL,now(),now()),
  ('cat-asia','Asia','asia',NULL,10,'cat-world',now(),now()),
  ('cat-americas','Americas','americas',NULL,11,'cat-world',now(),now()),
  ('cat-europe','Europe','europe',NULL,12,'cat-world',now(),now()),
  ('cat-politics','Politics','politics',NULL,13,NULL,now(),now()),
  ('cat-business','Business','business',NULL,14,NULL,now(),now()),
  ('cat-technology','Technology','technology',NULL,15,NULL,now(),now()),
  ('cat-sports','Sports','sports',NULL,16,NULL,now(),now()),
  ('cat-entertainment','Entertainment','entertainment',NULL,17,NULL,now(),now()),
  ('cat-lifestyle','Lifestyle','lifestyle',NULL,18,NULL,now(),now()),
  ('cat-opinion','Opinion','opinion',NULL,19,NULL,now(),now())
ON CONFLICT ("id") DO NOTHING;

-- ---------- Seed: users (password = admin123 / editor123 — CHANGE AFTER LOGIN) ----------
INSERT INTO "User" ("id","name","email","passwordHash","role","bio","createdAt","updatedAt") VALUES
  ('usr-admin','Sanjay','admin@thespnews.in','$2b$10$0AikSC9cR61aBCk0rka1Iu.6X/TjzpkOr/rI4fE9kGemGIu1O3/aO','ADMIN','Administrator',now(),now()),
  ('usr-editorial','SP News Editorial','editorial@thespnews.in','$2b$10$JpbMKWEFJwlGXF4R5Mz0C.TPK9wiGB9i4wKLX4Dm3bDaaNwYiQbyW','EDITOR','SP News Editorial Desk',now(),now())
ON CONFLICT ("email") DO NOTHING;

-- ---------- Seed: sample published article ----------
INSERT INTO "Article" ("id","title","slug","excerpt","content","status","featured","breaking","readTime","views","metaTitle","metaDescription","keywords","authorId","primaryCategoryId","publishedAt","createdAt","updatedAt") VALUES
  ('art-welcome','Welcome to Sanjay Pera News','welcome-to-sp-news',
   'SP News brings you trusted local coverage from Siliguri and across West Bengal.',
   '<p>Sanjay Pera News (SP News) delivers breaking news, in-depth analysis, and trusted journalism across politics, business, sports, entertainment, and technology.</p>',
   'PUBLISHED', true, false, 1, 0,
   'Welcome to Sanjay Pera News','Local news from Siliguri and West Bengal.','siliguri, west bengal, news',
   'usr-editorial','cat-west-bengal', now(), now(), now())
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "_ArticleCategories" ("A","B") VALUES
  ('art-welcome','cat-west-bengal'),
  ('art-welcome','cat-siliguri')
ON CONFLICT ("A","B") DO NOTHING;

-- ---------- Prisma baseline (so `prisma migrate deploy` on Render is a no-op) ----------
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id","checksum","finished_at","migration_name","logs","rolled_back_at","started_at","applied_steps_count")
SELECT gen_random_uuid()::text,
       '41fcfd60f0a67f60846576a54f8d95a65ddd357a4d3dc9b12584be3ccf1b4438',
       now(), '20260808050647_init', NULL, NULL, now(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260808050647_init');

-- ---------- Storage bucket for uploaded images (public read) ----------
-- Guarded so the script still succeeds if run on a plain (non-Supabase) DB.
DO $$ BEGIN
  INSERT INTO storage.buckets ("id","name","public")
  VALUES ('media','media', true)
  ON CONFLICT ("id") DO NOTHING;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'storage schema not found — skipping bucket creation (not Supabase?)';
END $$;

COMMIT;
