# BrainStack Architecture

Knowledge-first IT publishing platform with AI-assisted authoring, RAG-powered search, and conversational Q&A.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| AI Client | OpenAI SDK (multi-provider via registry) |
| Styling | CSS (IBM Plex Sans / Mono) |
| Testing | Vitest |
| Container | Docker (multi-stage) |

## Directory Layout

```
src/
├── app/
│   ├── (public)/          # Public-facing pages (blog, cheatsheets, discover, ask, stack)
│   ├── admin/             # Admin panel (AI providers, usage dashboard)
│   ├── api/               # API routes (see below)
│   ├── editor/            # MDX content editor (new + edit)
│   └── login/             # Auth page
├── components/
│   ├── chat/              # Conversational Q&A (chat panel, citations, messages)
│   └── editor/            # Editor UI (markdown editor, AI assist, preview, metadata)
├── db/
│   ├── schema.ts          # Drizzle table definitions
│   ├── relations.ts       # Table relations
│   └── index.ts           # DB connection pool
└── lib/
    ├── ai/                # AI provider registry, client factory, drafting, rewriting
    ├── rag/               # RAG pipeline (chunker, embedder, search, reranker, dedup)
    ├── auth.ts            # NextAuth config
    ├── mdx.ts             # MDX processing
    ├── pages.ts           # Page query helpers
    ├── rate-limiter.ts    # Request rate limiting
    └── slugify.ts         # URL slug generation
```

## API Routes

```
/api/auth/[...nextauth]           # NextAuth handlers
/api/pages                        # CRUD pages (list, create)
/api/pages/[id]                   # CRUD single page (get, update, delete)
/api/pages/[id]/publish           # Publish/unpublish
/api/pages/[id]/assets            # Asset management
/api/pages/[id]/tags              # Tag management
/api/pages/[id]/relations         # Page-to-page relations
/api/collections                  # Collection listing
/api/search                       # Hybrid search (FTS + vector)
/api/chat                         # Conversational Q&A with RAG
/api/ai/draft                     # AI content drafting
/api/ai/rewrite                   # AI content rewriting
/api/admin/providers              # AI provider CRUD
/api/admin/providers/[id]         # Single provider management
/api/admin/providers/[id]/test    # Connection test
/api/admin/providers/[id]/discover # Model discovery
```

## Data Model

```
users ──< conversations ──< messages
  │
pages ──< page_revisions
  │   ──< chunks ──< chunk_embeddings
  │   ──< page_tags
  │   ──< assets
  │   ──< page_relations (source/target)
  │
  └──── collections

ai_providers ──< ai_models
             ──< ai_usage_logs
```

### Key Tables

- **pages**: Content with MDX source, status (draft/published), collection/parent hierarchy
- **chunks / chunk_embeddings**: RAG pipeline output — text chunks with 1536-dim vector embeddings
- **ai_providers / ai_models**: Multi-provider AI registry (OpenAI-compatible, OpenRouter, LiteLLM)
- **conversations / messages**: Per-page or global chat with citation tracking

## Auth Flow

1. Credentials provider (email + bcrypt password hash)
2. JWT session strategy
3. Middleware protects `/editor/*` and `/admin/*` routes
4. Cookie-based token check (`authjs.session-token` or `__Secure-` prefix)

## AI Architecture

- **Provider Registry**: DB-backed, supports OpenAI-compatible, OpenRouter, LiteLLM proxy
- **Client Factory**: OpenAI SDK with configurable base URL, API key, headers per provider
- **Model Discovery**: Auto-discovers models from provider `/v1/models` endpoint
- **Capabilities Detection**: Heuristic-based (chat, embeddings, vision, responses)
- **Usage Logging**: Tracks tokens, latency, provider per request

## RAG Pipeline

1. **Chunker**: Splits MDX content into heading-anchored chunks
2. **Embedder**: Generates 1536-dim vectors via discovered embedding model
3. **Search**: Hybrid FTS (tsvector) + cosine similarity vector search
4. **Reranker**: Scores and reorders results
5. **Dedup**: Filters near-duplicate chunks

## Ports

| Service | Port |
|---------|------|
| Next.js (frontend + API) | 3100 |
| PostgreSQL | 5432 |

## Running

```bash
# Dev with Docker
docker compose -f docker-compose.dev.yml up

# Dev locally (requires running Postgres)
cp .env.example .env.local
pnpm install
pnpm dev

# Production
docker compose up --build

# Tests
pnpm test
```
