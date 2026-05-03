# SPEC — BrainStack

## §G — Goal

Knowledge-first IT publishing platform. One canonical page → 3 views (article, stack/docs, cheatsheet). AI-assisted authoring (Noa). RAG chat over published content w/ citations. OpenAI-compatible provider registry.

## §C — Constraints

- Next.js 16 App Router + React 19 + TypeScript
- PostgreSQL 16 + pgvector (1536-dim embeddings)
- Drizzle ORM + drizzle-kit migrations
- Auth.js v5 (credentials provider, JWT sessions, bcryptjs, admin-only write access)
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
| `/discover` | GET | browse published pages by topic |
| `/login` | GET | login form |

### Editor routes (admin role required)

| path | method | purpose |
|------|--------|---------|
| `/editor` | GET | article list — drafts/published, edit links |
| `/editor/new` | GET | create new page |
| `/editor/[id]` | GET | edit existing page |

### Settings routes (admin role required)

| path | method | purpose |
|------|--------|---------|
| `/settings` | GET | user settings — AI provider/model, editor, appearance, account (password change) |

### AI routes (admin role required)

| path | method | purpose |
|------|--------|---------|
| `/ask` | GET | site-wide RAG chat interface |

### Admin routes (admin role required)

| path | method | purpose |
|------|--------|---------|
| `/admin/ai/providers` | GET | provider management UI |
| `/admin/ai/usage` | GET | usage/cost tracking dashboard |

### API routes

| path | method | auth | purpose |
|------|--------|------|---------|
| `/api/pages` | GET | no | list pages (filters: status, collection_id, type) |
| `/api/pages` | POST | admin | create page |
| `/api/pages/[id]` | GET | no | get page by id |
| `/api/pages/[id]` | PUT | admin | update page |
| `/api/pages/[id]` | DELETE | admin | archive page (soft delete) |
| `/api/pages/[id]/publish` | POST | admin | publish → revision + chunk + embed |
| `/api/pages/[id]/tags` | PUT | admin | sync tags |
| `/api/pages/[id]/assets` | GET | admin | list assets for page |
| `/api/pages/[id]/assets` | POST | admin | upload image asset (multipart) |
| `/api/pages/[id]/assets` | DELETE | admin | delete asset by assetId |
| `/api/pages/[id]/relations` | GET | no | list relations for page |
| `/api/pages/[id]/relations` | POST | admin | create relation (related/prerequisite/see-also) |
| `/api/pages/[id]/relations` | DELETE | admin | delete relation by relationId |
| `/api/collections` | GET | no | list collections |
| `/api/search` | GET | no | keyword search (title/summary ILIKE) |
| `/api/chat` | POST | admin | RAG chat w/ citations (streams) |
| `/api/ai/draft` | POST | admin | generate draft from idea ± image (streams) |
| `/api/ai/rewrite` | POST | admin | rewrite content for style (streams) |
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
| `/api/account/password` | PATCH | admin | change own password (current + new) |
| `/api/auth/[...nextauth]` | GET,POST | — | NextAuth handlers |
| `/api/health` | GET | no | health check — DB connectivity, uptime (200 ok / 503 degraded) |

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
- V28: ∀ password change → verify current password before update
- V29: new password ! ≠ current password
- V30: password change API ! require authenticated session
- V31: password change error msgs ! generic — ⊥ leak specifics
- V32: only `admin` role exists; `editor` role removed; user creation default = `admin`
- V33: ∀ write API (`POST/PUT/DELETE /api/pages/*`, publish, tags, assets, relations) → require `role === 'admin'`
- V34: unauthenticated users = read-only; can view published articles + cheatsheets + discover only; ⊥ AI features
- V35: ∀ AI features (`/api/ai/draft`, `/api/ai/rewrite`, `/api/chat`) require `role === 'admin'`
- V36: `/editor/*` middleware ! check `role === 'admin'` — ⊥ token-only; redirect non-admin → `/`
- V37: `/settings` route requires valid session (admin); non-admin → redirect `/`
- V38: `/admin/*` unchanged — already requires `role === 'admin'`
- V39: client UI ! hide editor/admin/AI links for non-admin sessions
- V40: `/ask` page requires `role === 'admin'` (middleware); non-admin → redirect `/`
- V41: provider API keys ! encrypted at rest (AES-256-GCM); ⊥ plaintext in DB; GET responses ! mask key (write-only pattern)
- V42: `POST /api/setup` ! atomic — DB-level guard (unique constraint); endpoint ! return 403 after first admin exists; ⊥ `needsSetup` field in public responses; ⊥ two admins from concurrent requests
- V43: `requireAdmin()` ! single canonical impl in `src/lib/auth.ts`; ⊥ local copies in route files
- V44: `AUTH_SECRET` ! cryptographically random ≥ 32 bytes; seed password ! pass same validation as user-facing password (≥ 8 chars)
- V45: ∀ state-mutating API route → CSRF protection (SameSite=Lax|Strict on auth cookies + Origin header validation); ⊥ token-based CSRF (unnecessary w/ JWT + SameSite)
- V46: HTTP responses ! include security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`; CSP default ! deny by default (`default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`); `script-src` unsafe exceptions (`'unsafe-inline'`/`'unsafe-eval'`) may be enabled only where required by Next.js hydration + `next-mdx-remote`; `style-src 'unsafe-inline'` only until T42b completes CSS module migration; nonce-based CSP deferred until framework support matures
- V47: publish pipeline ! track embedding status per page (`pending` | `complete` | `failed`); admin UI ! show status; retry available on failure
- V48: ∀ `[id]` route param → validate UUID format before DB query; invalid → 400 (not 500)
- V49: chat history DB query ! `LIMIT ≤ 50` + `ORDER BY createdAt DESC` — ⊥ unbounded fetch; slice in DB not JS
- V50: `embeddingModel` column ! store actual model ID from provider; ⊥ hardcoded `'default'`
- V51: rate limiter ! not trust raw `x-forwarded-for`; require trusted proxy config | strip header at edge
- V52: `POST /api/admin/embeddings/reset` ! show chunk count + require explicit confirmation param before re-embedding; UI ! confirmation dialog
- V53: ∀ MDX render → `next-mdx-remote` output sanitized against `<script>`, event handlers, dangerous raw HTML, and executable `javascript:`/`data:` URLs before rendering; because `script-src` allows `'unsafe-inline'` per §V.46 tradeoff, CSP is not relied on for MDX XSS mitigation; CSP `frame-ancestors 'none'` + `X-Frame-Options: DENY` provide clickjacking defense only
- V54: `getProviders()` ! JOIN or filter models by needed provider IDs; ⊥ load entire `ai_models` table
- V55: design system ! use CSS modules | CSS custom properties for layout; ⊥ inline `style={{}}` as primary layout mechanism; hover/focus/responsive states ! work
- V56: chat `scopeType === 'page'` ! load all published chunks for `scopeId` directly in persisted document order; ⊥ relevance-gated hybrid search; generic/stop-word query ! still provide page context when chunks exist
- V57: ∀ page layout → ! function at 375px viewport; grid/flex containers ! collapse to single column ≤ 768px; page padding ! ≤ 16px below 640px; interactive elements ! not overflow container; sidebar toggle ! hidden when sidebar force-hidden

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
| T23 | ✓ | add `PATCH /api/account/password` route — verify session, check current pw, hash new pw, update DB | V28,V29,V30,V31,V22,I.api |
| T24 | ✓ | add "Account" tab to `/settings` page w/ password change form (current + new + confirm) | V28,V6,I.settings |
| T25 | ✓ | wire form submit → `PATCH /api/account/password`, show success/error feedback | V28,V29,V31,I.api |
| T26 | ✓ | add tests for password change API route | V28,V29,V30,V31 |
| T27 | ✓ | admin-only safeguard — remove `editor` role; upgrade middleware to check `role === 'admin'` for `/editor/*`, `/settings`; add `requireAdmin()` guard to all write API routes (`/api/pages` POST/PUT/DELETE, publish, tags, assets, relations, `/api/ai/draft`, `/api/ai/rewrite`); hide editor/AI nav links for non-admin; update schema default role; add tests | V32,V33,V34,V35,V36,V37,V38,V39 |
| T28 | ✓ | lock AI chat to admin — add `requireAdmin()` to `/api/chat`; add `/ask` to middleware matcher; hide "Ask AI" nav link for non-admin; update tests | V35,V40,V39,I.api |
| T29 | ✓ | encrypt provider API keys — AES-256-GCM encrypt/decrypt helpers; migrate existing plaintext to ciphertext; mask in GET responses; update provider CRUD; rollback plan if encryption key lost | V41,I.api |
| T30 | ✓ | harden setup endpoint — atomic admin creation (DB unique constraint); return 403 after first admin; remove `needsSetup` from GET response; disable POST after bootstrap | V42,I.api |
| T31 | ✓ | deduplicate `requireAdmin()` — delete all local copies in admin routes; import canonical from `src/lib/auth.ts`; verify tests pass | V43 |
| T32 | ✓ | rotate secrets + enforce seed validation — boot-time check rejects `AUTH_SECRET` < 32 bytes; seed script enforces ≥ 8 char password; `.env.example` documents requirements; generate crypto-random secret | V44,V22 |
| T33 | ✓ | add CSRF protection — verify SameSite=Lax|Strict on auth cookies (Auth.js default); add Origin header validation middleware for state-mutating routes; ⊥ token-based CSRF | V45,I.api |
| T34 | ✓ | add security headers — CSP (with unsafe-inline/eval tradeoff per §V.46), X-Content-Type-Options, X-Frame-Options, HSTS via Next.js config | middleware; covers V46 + V53 clickjacking defense only; MDX sanitization must be verified separately | V46,V53 |
| T35 | ✓ | publish pipeline status tracking — add `embeddingStatus` column to pages; update pipeline to set pending→complete→failed; show in editor UI; add retry button | V47,V10,I.api,I.admin |
| T36 | ✓ | UUID param validation — shared `validateUUID()` helper; apply to all `[id]` route handlers; return 400 on invalid format | V48,I.api |
| T37 | ✓ | bound chat history query — add `LIMIT 11` (10 displayed + 1 has-more sentinel) + `ORDER BY createdAt DESC` to DB query; reverse in JS; remove unbounded fetch | V49 |
| T38 | ✓ | store actual embedding model ID — replace hardcoded `'default'` with real model ID from provider in pipeline + sync + reset routes | V50 |
| T39 | ✓ | harden rate limiter — strip/ignore `x-forwarded-for` unless trusted proxy configured; document proxy requirements | V51 |
| T40 | ✓ | embedding reset confirmation — add chunk count display; require explicit confirmation param; add UI confirmation dialog | V52,I.api,I.admin |
| T41 | ✓ | optimize getProviders() query — JOIN models by provider IDs; ⊥ load entire `ai_models` table into memory; filter at DB level | V54 |
| T42a | ✓ | migrate layout component inline styles to CSS modules (top-nav, sidebar, sidebar-toggle, sidebar-tree, editor-layout) | V55 |
| T42b | ~ | migrate remaining component inline styles to CSS modules — 192 inline `style={{}}` remain; include mobile responsive fixes from issue #27 (homepage grid, admin/settings/editor/ask padding, provider buttons wrap, settings tabs, admin nav, editor bar, usage stat cards) | V55,V57 |
| T43 | ✓ | fix issue #24 — add persisted chunk order, direct page-scope chunk loader, route branch, regression test for generic "Ask this post" query | V16,V17,V18,V56,I.api |
| T44 | ✓ | fix sidebar toggle visibility on mobile — add `@media (max-width: 768px) { .toggleBtn { display: none } }` to `sidebar-toggle.module.css`; sidebar already hidden via `globals.css` but toggle orphaned | V57 |
| T45 | . | fix ask/chat virtual keyboard — replace `100vh` w/ `dvh` units + `env(safe-area-inset-bottom)` in `ask-client.tsx` + public layout | V57 |

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
| B16 | 2026-04-29 | V46/V53 drift — CSP `script-src 'unsafe-inline' 'unsafe-eval'` contradicts spec "block inline scripts"; T42 marked ✓ but 192 inline styles remain | amend V46+V53 to document CSP tradeoff (Next.js + next-mdx-remote require unsafe-inline/eval); split T42 → T42a (done) + T42b (pending) | fixed |
| B17 | 2026-05-03 | issue #24 — page-scoped chat used hybrid search relevance gate; generic stop-word query → 0 chunks → `"No relevant context was found"` | add V56; build T43 | open |
| B18 | 2026-05-03 | issue #27 — inline `style={{}}` layout ⊥ responsive; homepage grid `1fr 300px` no breakpoint; 40px padding wastes 21% mobile viewport; flex containers no wrap; sidebar toggle visible when sidebar hidden; settings tabs overflow; admin nav no collapse | V57; expand T42b scope; add T44 (sidebar toggle), T45 (dvh units) | open |
