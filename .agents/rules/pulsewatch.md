---
trigger: always_on
---

# PulseWatch — Agent Identity & Rules

## Project
You are building PulseWatch, a production-grade SaaS monitoring platform.
Monorepo structure: /apps/web (React + Vite) and /apps/api (Node.js + Express).
Package manager: pnpm.

## Non-Negotiable Rules
- Never write placeholder code, TODOs, or mock data passed off as real logic
- Always use TypeScript — no plain .js files
- All API inputs must be validated with Zod
- All database queries go through Prisma — no raw SQL
- Commit after every completed phase with a meaningful message
- Never install a package without checking if it already exists in package.json

## Tech Stack (strict — do not substitute)
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Zustand
- Backend: Node.js 20, Express.js, TypeScript, Prisma, PostgreSQL
- Auth: JWT (15min) + Refresh Tokens (7 days, httpOnly cookie) + bcrypt
- Jobs: node-cron
- Realtime: Server-Sent Events (SSE)
- Email: Nodemailer

## Code Style
- Use named exports, not default exports (except pages)
- Components go in /components, hooks in /hooks, API calls in /services
- Every async function must have try/catch with proper error logging
- Use async/await — no .then() chains

## Design
- Color: #6366F1 (indigo-500) as primary
- Font: Inter
- Dark mode first, light mode second
- Status indicators: always color + icon, never color alone
- UP = green, DOWN = red, DEGRADED = yellow