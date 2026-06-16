# Contributing to PulseWatch

Thank you for your interest in contributing to PulseWatch! This document outlines the guidelines and processes for contributing to the repository.

## Running Locally

To run PulseWatch on your local machine:
1. Ensure you have `Node.js` (v20+), `pnpm`, and a PostgreSQL instance running.
2. Clone the repository and install dependencies using `pnpm install`.
3. Copy `.env.example` to `.env` in the root, `apps/api`, and `apps/web`.
4. In `apps/api`, run `npx prisma migrate dev` and `npx tsx prisma/seed.ts`.
5. Start the development servers with `pnpm run dev`.

## Branch Naming Conventions

Please use the following prefixes for your branch names:
- `feature/*` - For new features (e.g., `feature/slack-integration`)
- `fix/*` - For bug fixes (e.g., `fix/login-crash`)
- `chore/*` - For maintenance, documentation, or dependency updates (e.g., `chore/update-readme`)

## PR Process

1. Create a feature branch from `main`.
2. Commit your changes locally. Write clear and descriptive commit messages.
3. Push your branch to the remote repository.
4. Open a Pull Request (PR) against `main`.
5. Ensure your PR description explains *what* changes were made and *why*.
6. All automated checks (linting, build) must pass before a merge.
7. A maintainer will review your code before merging.

## Code Style Notes

To maintain consistency and reliability across the codebase, please adhere to these strict rules:
- **TypeScript Strict:** All code must be strongly typed. Avoid using `any` unless absolutely necessary. No plain `.js` files.
- **Validation:** All incoming API requests must be validated using `Zod` schemas at the controller boundary.
- **Exports:** Prefer named exports (`export const MyComponent`) over default exports, except for page-level React components.
- **Database:** All database interactions must happen via Prisma Client. No raw SQL queries unless explicitly approved.
- **Async/Await:** Use `async/await` syntax and wrap everything in `try/catch` blocks. Avoid `.then()` promise chains.
