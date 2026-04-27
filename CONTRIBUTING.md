# Contributing to BrainStack

Thank you for your interest in contributing to BrainStack — an AI-powered IT publishing platform. This guide covers everything you need to get started.

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 20+ (for Next.js 16)
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) and Docker Compose (for PostgreSQL + pgvector)
- (Optional) [tsx](https://github.com/privatenumber/tsx) — for running seed scripts

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/brainstack.git
cd brainstack
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL 16 with pgvector on port 5432.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local settings. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Set to `true` for local dev |

### 5. Push database schema

```bash
pnpm drizzle-kit push
```

### 6. (Optional) Seed data

```bash
pnpm seed
```

### 7. Run the project

```bash
pnpm dev
```

App runs at [http://localhost:3100](http://localhost:3100).

## Branch Naming

Use type-prefixed branches:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring (no behavior change) |
| `test/` | Adding or updating tests |
| `chore/` | Build, CI, tooling changes |

Examples: `feat/rag-reranker`, `fix/auth-redirect`, `docs/api-endpoints`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>
```

### Types

`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`

### Scopes

| Scope | Area |
|-------|------|
| `api` | API routes (`src/app/api/`) |
| `ui` | React components (`src/components/`) |
| `auth` | Authentication and middleware |
| `db` | Database schema, migrations, queries |
| `rag` | RAG pipeline (chunker, embedder, search) |
| `ai` | AI provider registry and model discovery |
| `editor` | Content editor |
| `admin` | Admin panel |
| `account` | User account management (password, profile) |
| `ci` | CI/CD workflows |
| `config` | Configuration and environment |

### Rules

- Imperative mood: "add feature" not "added feature"
- Lowercase first letter
- No period at end
- Subject line max 50 characters

### Examples

```
feat(rag): add hybrid search with pgvector
fix(auth): handle expired JWT in middleware
docs(readme): update installation instructions
refactor(db): extract query builder into separate module
test(api): add rate limiter edge case tests
chore(ci): add Playwright E2E step to workflow
```

## Pull Request Process

1. Create a feature branch from `master`
2. Make your changes
3. Ensure all checks pass locally:

```bash
# Lint
pnpm lint

# Type check
pnpm tsc --noEmit

# Unit tests
pnpm test

# E2E tests (requires dev server running)
pnpm exec playwright test
```

4. Push your branch and open a PR
5. Fill out the PR template completely
6. At least one approving review is required
7. Squash and merge after approval
8. Delete the branch after merge

## Code Style

### Linting

- **ESLint** with Next.js config (`eslint.config.mjs`)
- Run: `pnpm lint`

### TypeScript

- Strict mode enabled
- Path alias: `@/*` → `src/*`
- All new code must be TypeScript — no `.js` files in `src/`

### Conventions

- Use Zod for all API input validation (`src/lib/validation.ts`)
- Use Drizzle ORM for database queries — no raw SQL
- Use `async/await` over `.then()` chains
- Prefer named exports over default exports
- Keep components in `src/components/` organized by feature
- Server components by default; add `"use client"` only when needed

## Testing

### Unit Tests

- **Framework:** Vitest
- **Location:** `src/__tests__/` and `src/lib/__tests__/`
- **Run:** `pnpm test`
- **Watch mode:** `pnpm test:watch`
- **Coverage:** `pnpm test --coverage`

### E2E Tests

- **Framework:** Playwright
- **Location:** `tests/`
- **Config:** `playwright.config.ts`
- **Run:** `pnpm exec playwright test`
- **Base URL:** `http://localhost:3100`

### Test Requirements

- New features need happy-path + edge-case tests
- Bug fixes need regression tests
- API routes need request/response validation tests

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public routes (blog, stack, cheatsheets, ask, discover)
│   ├── admin/              # Admin panel
│   ├── api/                # API routes
│   ├── editor/             # Content editor
│   ├── login/              # Authentication
│   └── settings/           # User preferences
├── components/             # React components by feature
├── db/                     # Drizzle schema, relations, migrations
└── lib/                    # Shared utilities
    ├── ai/                 # AI provider registry, model discovery
    └── rag/                # Chunker, embedder, hybrid search, reranker
```

## Issue Guidelines

### Bug Reports

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Include:
- Problem statement
- Proposed solution

### Labels

| Label | Purpose |
|-------|---------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `docs` | Documentation improvement |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `duplicate` | Duplicate issue |
| `wontfix` | Will not be addressed |
| `security` | Security-related |

## Security

Do not open public issues for security vulnerabilities. See [SECURITY.md](.github/SECURITY.md) for reporting instructions.

Key security rules:
- Never commit secrets or credentials
- Auth-related changes require extra review
- Input validation (Zod) must not be weakened
- Use Drizzle ORM for all database access (parameterized queries)
