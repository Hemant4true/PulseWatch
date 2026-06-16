# Deployment Guide

This guide provides step-by-step instructions for deploying PulseWatch to production using Supabase for the database, Railway for the backend API, and Vercel for the frontend React app.

## 1. Database (Supabase)

1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> Database**.
3. Locate your **Connection string** (URI). Select the "Nodejs" tab to get the connection pooler URL (usually port 6543, with `?pgbouncer=true` if using older Prisma, or simply use transaction mode).
4. Save this URI; you will use it as your `DATABASE_URL` for the backend.

## 2. Backend API (Railway)

1. Sign up/Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your `pulsewatch` repository.
4. Railway might detect the monorepo automatically. If not, go to the service settings and set the **Root Directory** to `/apps/api`.
5. Set the Start Command (if not automatically detected via `package.json`): `pnpm run start`.
6. Go to the **Variables** tab and add the following environment variables:
   - `DATABASE_URL`: The Supabase URI you copied earlier.
   - `JWT_SECRET`: A strong random string for JWTs.
   - `JWT_REFRESH_SECRET`: Another strong random string.
   - `PORT`: `3000` (Railway provides this automatically but good to set).
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: The URL where your Vercel app will be deployed (e.g., `https://pulsewatch.vercel.app`).
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Your SMTP credentials (e.g., Resend, Sendgrid, SES).
7. Go to **Settings -> Networking** and click **Generate Domain** to get a public API URL. Save this URL.

## 3. Frontend Web App (Vercel)

1. Sign up/Log in to [Vercel](https://vercel.com/).
2. Click **Add New -> Project**.
3. Import your `pulsewatch` repository.
4. Set the **Framework Preset** to `Vite`.
5. Set the **Root Directory** to `apps/web`.
6. Set the Build Command: `pnpm run build` and Output Directory: `dist`.
7. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: Your newly generated Railway API URL appended with `/api` (e.g., `https://pulsewatch-api.up.railway.app/api`).
8. Click **Deploy**.

## 4. Post-Deployment Steps

After both environments are successfully deployed, you need to apply your Prisma migrations and seed the initial Superadmin data.

1. Ensure you have the Railway CLI installed, or run this locally connected to your remote DB:
   ```bash
   cd apps/api
   export DATABASE_URL="your-supabase-connection-string"
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```
2. Open your Vercel frontend URL, log in with `superadmin@pulsewatch.app` (Password: `SuperAdmin123!`), and change the password immediately.

## 5. Custom Domain Setup for Status Pages

PulseWatch supports hosting status pages at `status.yourdomain.com` (e.g., via CNAME).

1. In your Vercel project settings, go to **Domains**.
2. Add your wildcard or specific subdomain (e.g., `status.example.com`).
3. Vercel will guide you to configure the DNS records on your domain registrar.
4. Users visiting `status.example.com` will hit the Vercel routing logic, and your frontend will resolve the correct status page via the slug or domain.
