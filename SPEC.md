# SPEC — BrainStack

## §G — Goal

Knowledge-first IT publishing platform. One canonical page → 3 views (article, stack/docs, cheatsheet). AI-assisted authoring (Noa). RAG chat over published content w/ citations. OpenAI-compatible provider registry.

## §C — Constraints

- Next.js 16 App Router + React 19 + TypeScript
- PostgreSQL 16 + pgvector (1536-dim embeddings)
- Drizzle ORM + drizzle-kit migrations
- Auth.js v5 (credentials provider, JWT sessions, bcryptjs)
- OpenAI SDK as client for all providers (custom baseURL)
- Custom CSS design system (IBM Plex fonts, amber/teal accents, NO Tailwind)
- MDX stored in DB, rendered server-side via next-mdx-remote
- Server-side AI calls only — no client-side API keys
- Streaming chat completions (text/event-stream)
- Provider-neutral internal format — Chat Completions required, Responses API optional
- Generation + embedding providers configurable separately

## §I — Interfaces

### Public routes (no auth)

| path | method | purpose |
|------|--------|---------|
| `/` | GET | homepage — recent posts, collections, tags |
| `/blog` | GET | article index — published tutorials/tips listing |
| `/blog/[slug]` | GET | article view (full tutorial + TOC + chat toggle) |
| `/stack/[collection]/[slug]` | GET | stack/docs view (collection context) |
| `/cheatsheets` | GET | cheatsheet index — published cheatsheets listing |
| `/cheatsheets/[slug]` | GET | cheatsheet view (compact reference) |
| `/ask` | GET | site-wide chat interface |
| `/discover` | GET | browse published pages by topic |
| `/login` | GET | login form |

### Editor routes (auth required)

| path | method | purpose |
|------|--------|---------|
| `/editor/new` | GET | create new page |
| `/editor/[id]` | GET | edit existing page |

### Settings routes (auth required)

| path | method | purpose |
|------|--------|---------|
| `/settings` | GET | user settings — AI provider/model, editor, appearance |

### Admin routes (admin role required)

| path | method | purpose |
|------|--------|---------|
| `/admin/ai/providers` | GET | provider management UI |
| `/admin/ai/usage` | GET | usage/cost tracking dashboard |

### API routes

| path | method | auth | purpose |
|------|--------|------|---------|
| `/api/pages` | GET | no | list pages (filters: status, collection_id, type) |
| `/api/pages` | POST | yes | create page |
| `/api/pages/[id]` | GET | no | get page by id |
| `/api/pages/[id]` | PUT | yes | update page |
| `/api/pages/[id]` | DELETE | yes | archive page (soft delete) |
| `/api/pages/[id]/publish` | POST | yes | publish → revision + chunk + embed |
| `/api/pages/[id]/tags` | PUT | yes | sync tags |
| `/api/pages/[id]/assets` | GET | yes | list assets for page |
| `/api/pages/[id]/assets` | POST | yes | upload image asset (multipart) |
| `/api/pages/[id]/assets` | DELETE | yes | delete asset by assetId |
| `/api/pages/[id]/relations` | GET | no | list relations for page |
| `/api/pages/[id]/relations` | POST | yes | create relation (related/prerequisite/see-also) |
| `/api/pages/[id]/relations` | DELETE | yes | delete relation by relationId |
| `/api/collections` | GET | no | list collections |
| `/api/search` | GET | no | keyword search (title/summary ILIKE) |
| `/api/chat` | POST | no | RAG chat w/ citations (streams) |
| `/api/ai/draft` | POST | yes | generate draft from idea ± image (streams) |
| `/api/ai/rewrite` | POST | yes | rewrite content for style (streams) |
| `/api/admin/providers` | GET | admin | list providers |
| `/api/admin/providers` | POST | admin | create provider |
| `/api/admin/providers/[id]` | GET | admin | get provider |
| `/api/admin/providers/[id]` | PUT | admin | update provider |
| `/api/admin/providers/[id]` | DELETE | admin | delete provider |
| `/api/admin/providers/[id]/test` | POST | admin | test connection |
| `/api/admin/providers/[id]/discover` | POST | admin | discover + store models |
| `/api/admin/providers/[id]/models` | POST | admin | add model manually (optional test) |
| `/api/admin/embeddings/stats` | GET | admin | chunk + embedding counts for admin UI |
| `/api/admin/embeddings/sync` | POST | admin | backfill missing embeddings for chunks w/o vectors |
| `/api/admin/embeddings/reset` | POST | admin | delete all embeddings + re-embed all chunks |
| `/api/auth/[...nextauth]` | GET,POST | — | NextAuth handlers |

### Setup routes (bootstrap, one-time)

| path | method | auth | purpose |
|------|--------|------|---------|
| `/setup` | GET | no | first-run setup page — create initial admin user |
| `/api/setup` | POST | no | create admin user (bootstrap only) |

### Config files

| file | purpose |
|------|---------|
| `drizzle.config.ts` | Drizzle migration config (pg dialect) |
| `.env.local` | DATABASE_URL, NEXTAUTH_SECRET, provider API keys |

## §V — Invariants

- V1: `/editor/*` and `/admin/*` require valid session (middleware.ts)
- V2: admin API routes require `role === 'admin'`
- V3: page `slug` unique across all pages (DB constraint)
- V4: page `status` ∈ {draft, published, archived}; default draft
- V5: page `type` ∈ {tutorial, tip, cheatsheet, note}; default tutorial
- V6: only published pages appear in public views
- V7: provider `kind` ∈ {openai_compatible, openrouter, litellm_proxy}
- V8: provider `discoveryMode` ∈ {v1-models, openrouter-models, litellm-model-info, static}
- V9: only enabled providers used for generation/embedding
- V10: publish creates page_revision + triggers async chunk+embed pipeline
- V11: existing chunks deleted before re-chunking on publish
- V12: chunks split by H1-H3 headings, then by token window; code blocks separate from prose
- V13: embedding dimension fixed at 1536
- V14: if no embedding provider available, chunking still succeeds (graceful fallback)
- V15: hybrid search = lexical (FTS tsvector) + semantic (pgvector cosine) + RRF (K=60)
- V16: chat scopes: page, collection, site — filter retrieval accordingly
- V17: chat citations include page title, slug, anchor, content snippet
- V18: AI answers must include citations or state insufficient evidence
- V19: conversation state stored in app DB, not provider-side
- V20: streaming responses for all AI endpoints (draft, rewrite, chat)
- V21: `title` required for page creation
- V22: passwords hashed with bcryptjs before storage
- V23: authenticated users ! have visible logout action
- V24: main sidebar ! be collapsible — user can hide/show via toggle
- V25: admin can trigger bulk embedding sync — backfill chunks w/o embeddings
- V26: admin can reset all embeddings + re-embed (model change scenario)
- V27: embedding sync ! report progress (chunks processed / total)

## §T — Tasks

| id | status | task | cites |
|----|--------|------|-------|
| T1 | ✓ | scaffold app + DB + auth | V1,V2,V22 |
| T2 | ✓ | content model + public rendering (blog/stack/cheatsheet/discover) | V3,V4,V5,V6,I.public |
| T3 | ✓ | provider registry + admin UI (CRUD, test, discover) | V7,V8,V9,I.admin |
| T4 | ✓ | AI draft + rewrite endpoints (streaming) | V20,I.api |
| T5 | ✓ | publish → chunk → embed pipeline | V10,V11,V12,V13,V14 |
| T6 | ✓ | hybrid search (lexical + semantic + RRF) | V15 |
| T7 | ✓ | chat w/ citations (multi-turn, streaming, scopes) | V16,V17,V18,V19,V20 |
| T8 | ✓ | upgrade `/api/search` to use hybrid search | V15,I.api |
| T9 | ✓ | image upload + storage (assets endpoint) | I.api |
| T10 | ✓ | page relations endpoints + "related pages" UI | I.api,I.public |
| T11 | ✓ | duplicate detection before publish | V6 |
| T12 | ✓ | usage logging + cost tracking (telemetry table + admin view) | I.admin |
| T13 | ✓ | rate limiting on public AI endpoints (chat, search, draft, rewrite) | I.api |
| T14 | ✓ | test suite — provider adapter, retrieval, chunker, slugify, auth (middleware, authorize, admin guard, page guard) | V1-V22 |
| T15 | ✓ | reranking layer (BM25) for search quality | V15 |
| T16 | ✓ | Docker Compose for local dev | §C |
| T17 | ✓ | manual model entry + test for proxy providers | V7,V9,I.api,I.admin |
| T18 | ✓ | logout button — add sign-out action to top-nav (auth users only) | V23,I.public |
| T19 | ✓ | collapsible sidebar — toggle button, persist preference, responsive | V24,I.public |
| T20 | ✓ | fix chat validation error — diagnose & harden `/api/chat` 400 path | V18,I.api |
| T21 | ✓ | verify content pipeline — confirm seed data indexed (FTS) + embedded (vectors); document gaps | V10,V13,V15 |
| T22 | ✓ | embedding sync — `POST /api/admin/embeddings/sync` backfill missing; `POST /api/admin/embeddings/reset` clear+re-embed; admin UI button w/ progress | V25,V26,V27,I.api,I.admin |

## §B — Bugs

| id | date | cause | fix | status |
|----|------|-------|-----|--------|
| B1 | 2026-04-25 | `/settings` route missing — nav gear icon links to 404 | create `src/app/settings/layout.tsx` + `page.tsx` standalone page; tabs: AI Provider (model selection), Editor (placeholder), Appearance (theme, code syntax, font size, reading width) | fixed |
| B2 | 2026-04-25 | `/cheatsheets` index page missing — only `[slug]` exists | create `src/app/(public)/cheatsheets/page.tsx` listing published cheatsheet-type pages; shared `PageListClient` component | fixed |
| B3 | 2026-04-25 | `/ask` input area not centered — `maxWidth: 700` but no `margin: '0 auto'` | add `margin: '0 auto'` to input wrapper + messages area in `ask-client.tsx` | fixed |
| B4 | 2026-04-25 | `/blog` index page missing — nav "Article" links to 404 | create `src/app/(public)/blog/page.tsx` listing published article/tutorial pages; shared `PageListClient` component | fixed |
| B5 | 2026-04-25 | theme toggle button not working — stale closure in `toggleTheme` | use functional update `setThemeState(prev => ...)` with empty deps in `theme-provider.tsx` | fixed |
| B6 | 2026-04-25 | no embedding model selection in AI provider config | add generation + embedding model dropdowns to Settings page AI tab; pull from `/api/admin/providers` | fixed |
| B7 | 2026-04-25 | no admin link from main dashboard — admin pages only reachable by direct URL | add shield icon + conditional admin link to `top-nav.tsx`; links to `/admin/ai/providers` | fixed |
| B8 | 2026-04-27 | chat API no model fallback — `findChatProvider()` picked first DB model (ollama/kimi-k2.5, paywalled 403); no retry logic | create shared `chatWithFallback()` in `src/lib/ai/find-chat-model.ts`; tries all chat-capable models sequentially until one succeeds | fixed |
| B9 | 2026-04-27 | duplicated `findChatProvider()` — identical function copy-pasted in `chat/route.ts`, `draft.ts`, `rewrite.ts` | extract to shared `find-chat-model.ts` module; all three consumers now use `chatWithFallback()` | fixed |
| B10 | 2026-04-27 | non-chat models in chat candidates — embedding (text-embedding-3-large etc), TTS, image models (dall-e, FLUX) included because `supports_chat=true` in DB | add `SKIP_PATTERNS` filter to exclude embed/tts/dall-e/image/FLUX model IDs | fixed |
| B11 | 2026-04-27 | search returns results for gibberish queries — semantic search always returns closest vector; `minMaxNormalize` maps single result to score 1.0 | fix `minMaxNormalize` to return 0 when all values are 0; add similarity threshold `> 0.3` in semantic SQL; add min combined score filter `> 0.05` in reranker | fixed |
| B12 | 2026-04-27 | no footer on any public page — no `<footer>` element exists | create `SiteFooter` component with copyright + nav links; add to public layout below content area | fixed |
| B13 | 2026-04-27 | `/editor` returns 404 — no article list/index page exists; only `/editor/[id]` and `/editor/new` | create `src/app/editor/page.tsx` with article list, status filters (all/draft/published), edit links, new article button | fixed |
| B14 | 2026-04-27 | embedding model no fallback — `findEmbeddingProvider()` picked first DB model; paywalled models cause silent failure | refactor `embedder.ts` with `findEmbeddingCandidates()` + sequential fallback loop; same pattern as chat fallback | fixed |
| B15 | 2026-04-27 | chat API returns `"Error: Validation failed"` 400 — `conversationId: null` sent by client; Zod `.uuid().optional()` rejects null | make `conversationId` `.nullable().optional()` in schema; client omits null fields; better error display in chat UI | fixed |
