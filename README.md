# 🧠 BrainStack

**Knowledge-first IT publishing platform with AI-powered authoring and RAG-powered search.**

BrainStack is a self-hosted knowledge base for technical teams. Write tutorials, tips, cheatsheets, and notes in MDX — then let AI help you draft, rewrite, and search across everything with natural language.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![pgvector](https://img.shields.io/badge/pgvector-semantic_search-336791)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### Content System
- **Four content types**: Tutorial, Tip, Cheatsheet, Note
- **Collections**: Organize content by topic (DevOps, Frontend, Backend, etc.)
- **MDX authoring**: Full Markdown + JSX with syntax highlighting, callouts, code blocks
- **Version history**: Every edit creates a revision
- **Tags & relations**: Link related content, prerequisites, see-also references
- **Draft → Published → Archived** lifecycle

### AI-Powered Authoring
- **Draft generation**: Describe an idea → get a full MDX article
- **Image-to-tutorial**: Upload a screenshot → get a step-by-step guide
- **Content rewriting**: Change tone, simplify, expand, or translate
- **Multi-provider support**: OpenAI, OpenRouter, LiteLLM proxy, any OpenAI-compatible API
- **Model discovery**: Auto-discover available models from providers
- **Usage tracking**: Token counts, costs, and latency dashboard

### RAG-Powered Search & Chat
- **Hybrid search**: Full-text search + semantic vector search with Reciprocal Rank Fusion
- **Conversational Q&A**: Ask questions about your knowledge base with cited sources
- **Smart chunking**: Heading-aware content splitting for precise retrieval
- **BM25 reranking**: Result quality optimization
- **Near-duplicate detection**: Avoid redundant search results

### Three Public Views
- **Blog** (`/blog`) — Long-form articles and tutorials
- **Stack** (`/stack`) — Hierarchical docs/wiki tree
- **Cheatsheets** (`/cheatsheets`) — Quick reference cards

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Custom CSS, IBM Plex fonts |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (credentials + JWT) |
| AI | OpenAI SDK (multi-provider) |
| Content | MDX (next-mdx-remote) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Container | Docker (multi-stage build) |
| Package Manager | pnpm |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-org/brainstack.git
cd brainstack

# Copy environment file
cp .env.example .env.local

# Start everything
docker compose -f docker-compose.dev.yml up -d

# Open http://localhost:3100
# First visit → setup page to create admin account
```

### Option 2: Manual Setup

**Prerequisites**: Node.js 20+, pnpm, PostgreSQL 16 with pgvector extension

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# Push schema to database
pnpm drizzle-kit push

# Seed example content (optional)
pnpm seed

# Start dev server
pnpm dev

# Open http://localhost:3100
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://noa:noa@localhost:5432/brainstack` |
| `AUTH_SECRET` | NextAuth.js secret (min 32 chars) | — (required) |
| `AUTH_TRUST_HOST` | Trust proxy headers | `true` |

Generate a secret: `openssl rand -base64 32`

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public routes (blog, stack, cheatsheets, ask, discover)
│   ├── admin/              # Admin panel (provider management, usage dashboard)
│   ├── api/                # API routes (pages, search, chat, AI, auth)
│   ├── editor/             # Content editor (create, edit, publish)
│   ├── login/              # Authentication
│   ├── settings/           # User preferences (AI, appearance, account)
│   └── setup/              # First-run admin setup
├── components/             # React components (chat, editor, navigation, MDX)
├── db/                     # Drizzle schema, relations, connection pool
└── lib/                    # Shared utilities
    ├── ai/                 # Provider registry, model discovery, draft/rewrite
    ├── rag/                # Chunker, embedder, hybrid search, reranker
    ├── auth.ts             # NextAuth.js configuration
    ├── pages.ts            # Page query helpers
    └── rate-limiter.ts     # Request rate limiting
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
pnpm test              # Run once
pnpm test:watch        # Watch mode

# E2E tests (Playwright)
pnpm playwright test   # Run all E2E tests
```

**Unit test coverage**: Authentication, middleware, slugification, provider registry, content chunking, hybrid search, API auth guards, citation formatting, password change.

**E2E test coverage**: Search functionality, AI draft/rewrite endpoints, chat Q&A.

---

## 📡 API Reference

### Public Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/search?q=...` | Hybrid search (FTS + vector) |
| `POST` | `/api/chat` | RAG chat with citations (streaming) |
| `GET` | `/api/collections` | List all collections |
| `GET` | `/api/health` | Health check (DB, uptime) |

### Authenticated Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/pages` | List / create pages |
| `GET/PUT/DELETE` | `/api/pages/:id` | Read / update / archive page |
| `POST` | `/api/pages/:id/publish` | Publish + chunk + embed |
| `POST` | `/api/ai/draft` | Generate article from idea |
| `POST` | `/api/ai/rewrite` | Rewrite content for style |
| `PATCH` | `/api/account/password` | Change own password |

### Admin Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/admin/providers` | Manage AI providers |
| `POST` | `/api/admin/providers/:id/discover` | Auto-discover models |
| `POST` | `/api/admin/providers/:id/test` | Test provider connection |

---

## 🐳 Docker

### Development
```bash
docker compose -f docker-compose.dev.yml up -d
```
Hot reload enabled. App on `:3100`, PostgreSQL on `:5432`.

### Production
```bash
docker compose up -d
```
Multi-stage build. Optimized Next.js standalone output.

---

## 🔒 Security

- Passwords hashed with bcryptjs (12 rounds)
- JWT session tokens via NextAuth.js v5
- Middleware-protected routes (`/editor/*`, `/admin/*`)
- Admin role required for provider management
- Rate limiting on public API endpoints
- Input validation with Zod on all API routes
- Password change requires current password verification

---

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture and data model
- [SPEC.md](./SPEC.md) — Project specification (caveman format)
- [RESEARCH.md](./RESEARCH.md) — Product research and design rationale
- [FORMAT.md](./FORMAT.md) — Spec format documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and open a PR

---

## 📄 License

MIT
