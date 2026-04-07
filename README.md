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

4. **Run**

   ```bash
   npm run dev
   ```

   Open `/login`, then edit pages from the sidebar.

## Railway

1. Create a **PostgreSQL** plugin and set `DATABASE_URL` on the web service.
2. Set `AUTH_SECRET`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`, and `NEXTAUTH_URL` (your public HTTPS URL).
3. **Build**: `npm run build` (or use the included `Dockerfile`).
4. **Release / start**: run migrations before or at startup, e.g. `npx prisma migrate deploy && node server.js` for the standalone output (see `Dockerfile`).

## Docker image

```bash
docker build -t status-report .
docker run --env-file .env -p 3000:3000 status-report
```

Ensure the same env vars as production, especially `DATABASE_URL` and `NEXTAUTH_URL`.

## Repository

Remote: `git@github.com:cornndawwg/status-report.git`
