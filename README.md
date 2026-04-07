# Status report

Next.js app for weekly status reports: three sections (Marketing, Salesforce, Additional Projects), nested pages, category bullets and checklists, and PDF export.

## Local development

1. **Postgres** (Docker):

   ```bash
   docker compose up -d
   ```

   The compose file maps Postgres to host port **5433** (change in `docker-compose.yml` if that port is busy).

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — default matches `docker-compose.yml`
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_EMAIL` — your login email
   - `AUTH_PASSWORD_HASH` — bcrypt hash of your password (never commit plaintext)

   Generate a hash:

   ```bash
   node -e "require('bcryptjs').hash('your-password', 12).then(console.log)"
   ```

   - `NEXTAUTH_URL` — `http://localhost:3000` locally

3. **Database**

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

### Seed production (Railway) from your laptop

You do **not** need Railway SSH or `railway run`. Use the **public** Postgres URL from Railway (Postgres plugin → **Connect** / **Variables** → external `DATABASE_URL`).

From this repo, after `npm install`:

```bash
npx prisma generate
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" npm run db:seed
```

Use the exact URL Railway gives you (often includes `sslmode=require`). Run **once** per empty database.

4. **Run**

   ```bash
   npm run dev
   ```

   Open `/login`, then edit pages from the sidebar.

## Railway

1. Create a **PostgreSQL** plugin and set `DATABASE_URL` on the web service.
2. Set `AUTH_SECRET`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`, and `NEXTAUTH_URL` (your public HTTPS URL).
3. **Build**: `npm run build` (or use the included `Dockerfile`).
4. **Start / migrations**: do **not** rely on `npx prisma` in minimal or standalone images (the `prisma` binary is often missing from `PATH`). Use:
   - `npm run migrate:deploy && npm start`, or
   - the **`Dockerfile`** default command (runs migrations via `node ./node_modules/prisma/build/index.js`, then `node server.js`).
5. **Do not set `PORT` yourself** in Railway variables unless you know you need to. Railway injects `PORT` automatically; the app listens on that port. A wrong `PORT` (e.g. forcing `3000` when the platform expects another) can cause **502** responses.
6. **502 Bad Gateway**: usually the container exited or never listened. Check **Deploy logs** (not only Build logs) for `migrate deploy` or Node errors. Confirm `DATABASE_URL` on the **web** service points at Postgres (reference the plugin’s variable). After deploy, `GET /api/health` should return `{"ok":true}` without logging in.

7. **Custom Start Command on Railway** — If you set this to **only** `npm run migrate:deploy`, migrations run and then **nothing starts the web server** (502, logs stop right after Prisma). Either:
   - **Clear** the custom start command so the **Dockerfile** `CMD` runs (migrate + `node server.js`), or
   - Set it to: `npm run start:railway` (runs migrate **and** `node server.js` in the standalone layout).

## Docker image

```bash
docker build -t status-report .
docker run --env-file .env -p 3000:3000 status-report
```

Ensure the same env vars as production, especially `DATABASE_URL` and `NEXTAUTH_URL`.

## Repository

Remote: `git@github.com:cornndawwg/status-report.git`
