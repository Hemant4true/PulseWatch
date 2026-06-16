# 💓 PulseWatch

> **Production-grade SaaS Monitoring Platform**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

PulseWatch is a robust, real-time monitoring solution for your web infrastructure. Monitor uptime, track performance trends, collaborate with your team, and inform your users with public status pages.

## Features

- **Real-time Uptime Monitoring:** Track endpoints using highly optimized background cron jobs.
- **Incident Management:** Automatically create and manage incidents when services degrade.
- **Custom Public Status Pages:** Branded status pages (e.g., `status.yourdomain.com`) to keep your users informed.
- **Multi-tenant Workspaces:** Built-in team collaboration, role-based access control (RBAC), and invitations.
- **Real-time Dashboard:** Server-Sent Events (SSE) provide live updates to the frontend without refreshing.
- **Detailed Analytics:** Visual charts using Recharts and PDF exports for historical uptime reporting.
- **Automated Alerts:** Get email notifications immediately when endpoints go down.
- **Secure Authentication:** JWT, refresh tokens (httpOnly), and bcrypt hashing.

## Screenshots

<!-- screenshot: dashboard_light.png -->
<!-- screenshot: dashboard_dark.png -->
<!-- screenshot: public_status_page.png -->

## Local Development Setup

To run PulseWatch on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/pulsewatch.git
   cd pulsewatch
   ```

2. **Install Dependencies:**
   PulseWatch uses `pnpm` as its package manager.
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the root and both `apps/api` and `apps/web`.
   ```bash
   cp .env.example .env
   ```
   Fill in your local PostgreSQL database URL and other credentials.

4. **Initialize Database:**
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   npx tsx prisma/seed.ts
   cd ../..
   ```

5. **Start Development Servers:**
   ```bash
   pnpm run dev
   ```
   This concurrently runs the Vite frontend (port 5173) and the Express backend (port 3000).

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/pulsewatch` |
| `JWT_SECRET` | Secret key for signing access tokens | `supersecretkey` |
| `JWT_REFRESH_SECRET`| Secret key for signing refresh tokens| `anothersecretkey` |
| `SMTP_HOST` | Email SMTP Host | `smtp.resend.com` |
| `SMTP_PORT` | Email SMTP Port | `465` |
| `SMTP_USER` | Email SMTP Username | `resend` |
| `SMTP_PASS` | Email SMTP Password | `re_abc123` |
| `SMTP_FROM` | Sender address for notifications | `noreply@pulsewatch.app` |
| `FRONTEND_URL` | URL of the frontend application | `http://localhost:5173` |
| `PORT` | Backend Express Port | `3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `VITE_API_URL` | Frontend env var pointing to backend | `http://localhost:3000/api` |

## Deployment

For comprehensive deployment instructions covering Supabase (Database), Railway (API), and Vercel (Frontend), see the [Deployment Guide](DEPLOYMENT.md).

## License

MIT
