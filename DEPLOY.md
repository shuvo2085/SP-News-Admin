# Deploying the SP News admin (web service) to Render + Supabase

This deploys **only the web service** (admin panel + JSON API). The mobile app
just points at the resulting URL afterwards.

---

## 1. Create the database on Supabase (free)

1. Go to <https://supabase.com> → **New project**. Pick a name and a strong
   **database password** (save it).
2. When it's ready, open **Project → Connect** (top bar) → **ORMs** tab.
3. Copy the two connection strings:
   - **Transaction pooler** (port `6543`) → this is your `DATABASE_URL`
     (make sure it ends with `?pgbouncer=true`).
   - **Session pooler** (port `5432`, same `…pooler.supabase.com` host) → this
     is your `DIRECT_URL`. Use the Session pooler rather than the raw "Direct
     connection" so migrations run from Render's network without IPv6 issues.
4. Replace `[YOUR-PASSWORD]` in each with the database password from step 1.
   If your password has special characters (@ : / ? #), URL-encode them.

> These map to the two vars in [.env.example](.env.example).

---

## 2. Push this `web/` folder to GitHub

This folder is already its own git repo. From inside `web/`:

```bash
git add -A
git commit -m "SP News admin — ready to deploy"
gh repo create sp-news-admin --private --source=. --push
```

(or create an empty repo on github.com and `git remote add origin … && git push -u origin main`.)

> `.env` is git-ignored — your secrets are **not** pushed. `.env.example` is.

---

## 3. Create the Render web service

**Option A — Blueprint (uses [render.yaml](render.yaml), recommended):**

1. Render dashboard → **New +** → **Blueprint**.
2. Connect the GitHub repo. Render detects `render.yaml`.
3. When prompted, paste **DATABASE_URL** and **DIRECT_URL** from step 1.
   `JWT_SECRET` is generated automatically. → **Apply**.

**Option B — Manual web service:**

- New + → **Web Service** → pick the repo.
- Runtime **Node**, Build `npm ci --include=dev && npm run render-build`,
  Start `npm run start`.
- Add env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (any long random
  string), `NODE_VERSION=22`.

The build runs migrations + seeds the database, then builds Next.js. First
deploy takes a few minutes.

---

## 4. Sign in and secure it

- Open `https://<your-app>.onrender.com` → you'll be sent to **/login**.
- Seeded admin: **admin@thespnews.in** / **admin123**.
- **Change this immediately** — Users → (create a new admin, delete/rotate the
  default), or update the password in the DB. The default is public knowledge.

---

## 5. Point the mobile app at the live API

In `mobile/src/api.ts`, set `HOST` to your Render URL, e.g.
`https://sp-news-admin.onrender.com`. Rebuild the app.

---

## Notes / gotchas

- **Free tier sleeps.** Render free web services spin down after inactivity;
  the first request after idle takes ~30s to wake. Fine for testing.
- **Uploaded images use Supabase Storage** (persistent). Set `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (from Supabase → Project Settings → API) in Render.
  The `media` bucket is created by `supabase-setup.sql`. If those env vars are
  **not** set (e.g. local dev), uploads fall back to `public/uploads` on disk.
  The service_role key is secret — never expose it to the browser or the app.
- **Migrations** run automatically on every deploy via `render-build`
  (`prisma migrate deploy`). The seed is idempotent (upserts), so re-running is
  safe.
