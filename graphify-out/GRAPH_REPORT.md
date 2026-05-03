# Graph Report - .  (2026-05-03)

## Corpus Check
- 158 files · ~80,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 378 nodes · 620 edges · 28 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.81)
- Token cost: 36,802 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & Provider CRUD|API Routes & Provider CRUD]]
- [[_COMMUNITY_UI Components & Chat|UI Components & Chat]]
- [[_COMMUNITY_Public Pages & MDX|Public Pages & MDX]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_AI Chat & Fallback|AI Chat & Fallback]]
- [[_COMMUNITY_AI Provider Discovery|AI Provider Discovery]]
- [[_COMMUNITY_RAG Search & Reranker|RAG Search & Reranker]]
- [[_COMMUNITY_Admin Provider Management|Admin Provider Management]]
- [[_COMMUNITY_Database Migrations (Core)|Database Migrations (Core)]]
- [[_COMMUNITY_Content Data Model|Content Data Model]]
- [[_COMMUNITY_Pages API & Slugify|Pages API & Slugify]]
- [[_COMMUNITY_RAG Chunker|RAG Chunker]]
- [[_COMMUNITY_Seed Script|Seed Script]]
- [[_COMMUNITY_Editor AI Assist|Editor AI Assist]]
- [[_COMMUNITY_Middleware & Auth|Middleware & Auth]]
- [[_COMMUNITY_Docker Infrastructure|Docker Infrastructure]]
- [[_COMMUNITY_MDX Heading Components|MDX Heading Components]]
- [[_COMMUNITY_Article TOC|Article TOC]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_PNPM Workspace|PNPM Workspace]]
- [[_COMMUNITY_Window Icon|Window Icon]]
- [[_COMMUNITY_Vercel Icon|Vercel Icon]]
- [[_COMMUNITY_File Icon|File Icon]]
- [[_COMMUNITY_Next.js Icon|Next.js Icon]]
- [[_COMMUNITY_Globe Icon|Globe Icon]]
- [[_COMMUNITY_DB Migrations (Enum)|DB Migrations (Enum)]]
- [[_COMMUNITY_DB Migrations (Admin)|DB Migrations (Admin)]]
- [[_COMMUNITY_Init DB Extensions|Init DB Extensions]]

## God Nodes (most connected - your core abstractions)
1. `requireAdmin()` - 42 edges
2. `unauthorizedResponse()` - 40 edges
3. `validateBody()` - 29 edges
4. `isValidUUID()` - 25 edges
5. `Icon()` - 20 edges
6. `getPublishedPages()` - 13 edges
7. `getCollections()` - 11 edges
8. `getProvider()` - 11 edges
9. `checkRateLimit()` - 10 edges
10. `createAIClient()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `users Table` --shares_data_with--> `Auth Flow`  [INFERRED]
  src/db/0000_lovely_sir_ram.sql → ARCHITECTURE.md
- `chunks Table` --shares_data_with--> `RAG Pipeline`  [INFERRED]
  src/db/0000_lovely_sir_ram.sql → ARCHITECTURE.md
- `chunk_embeddings Table` --shares_data_with--> `RAG Pipeline`  [INFERRED]
  src/db/0000_lovely_sir_ram.sql → ARCHITECTURE.md
- `ai_providers Table` --shares_data_with--> `AI Architecture`  [INFERRED]
  src/db/0000_lovely_sir_ram.sql → ARCHITECTURE.md
- `ai_models Table` --shares_data_with--> `AI Architecture`  [INFERRED]
  src/db/0000_lovely_sir_ram.sql → ARCHITECTURE.md

## Hyperedges (group relationships)
- **RAG pipeline: publish → chunk → embed → search → chat** — spec_publish_pipeline, spec_hybrid_search, spec_rag_chat, spec_postgresql_pgvector, spec_provider_registry [EXTRACTED 1.00]
- **AI capabilities: Noa authoring + RAG chat + provider registry** — spec_noa, spec_rag_chat, spec_provider_registry, spec_openai_sdk, spec_streaming [EXTRACTED 1.00]
- **Security model: auth + encryption + CSRF + CSP + MDX sanitization** — spec_admin_only_auth, spec_security, spec_authjs_v5 [EXTRACTED 1.00]

## Communities

### Community 0 - "API Routes & Provider CRUD"
Cohesion: 0.12
Nodes (31): deleteProvider(), getProviders(), rewriteContent(), DELETE(), GET(), POST(), POST(), POST() (+23 more)

### Community 1 - "UI Components & Chat"
Cohesion: 0.06
Nodes (9): Icon(), PublicShell(), SidebarToggle(), ThemeProvider(), useTheme(), useChat(), useKeyboardShortcuts(), applyAppearanceCss() (+1 more)

### Community 2 - "Public Pages & MDX"
Cohesion: 0.13
Nodes (19): sitemap(), BlogPage(), CheatsheetsPage(), JsonLd(), Tag(), DiscoverPage(), estimateReadTime(), extractHeadings() (+11 more)

### Community 3 - "Project Documentation"
Cohesion: 0.11
Nodes (27): BookStack, BrainStack Platform, Graphify knowledge graph integration, Contributing Guide, Spec Format (Caveman Encoding), Product Research and Vision, Admin-only access model (single role), API routes (pages, search, chat, AI, admin, auth) (+19 more)

### Community 4 - "AI Chat & Fallback"
Cohesion: 0.16
Nodes (14): generateDraft(), chatWithFallback(), decryptApiKey(), findChatCandidates(), logAIUsage(), decrypt(), encrypt(), getEncryptionKey() (+6 more)

### Community 5 - "AI Provider Discovery"
Cohesion: 0.19
Nodes (16): createAIClient(), addManualModel(), createProvider(), decryptApiKey(), detectCapabilities(), discoverModels(), getProvider(), rowToProviderConfig() (+8 more)

### Community 6 - "RAG Search & Reranker"
Cohesion: 0.22
Nodes (11): detectDuplicates(), embedQuery(), bm25Score(), idf(), minMaxNormalize(), rerankBM25(), tokenize(), extractRows() (+3 more)

### Community 7 - "Admin Provider Management"
Cohesion: 0.14
Nodes (4): closeForm(), fetchEmbeddingStats(), handleEmbeddingAction(), handleSave()

### Community 8 - "Database Migrations (Core)"
Cohesion: 0.14
Nodes (15): ai_models Table, ai_providers Table, conversations Table, messages Table, users Table, ai_providers_discovery_mode_check Constraint, ai_providers_kind_check Constraint, Admin Role Default Migration (+7 more)

### Community 9 - "Content Data Model"
Cohesion: 0.2
Nodes (12): assets Table, chunk_embeddings Table, chunks Table, collections Table, page_relations Table, page_revisions Table, page_tags Table, pages Table (+4 more)

### Community 10 - "Pages API & Slugify"
Cohesion: 0.36
Nodes (5): isPageStatus(), isPageType(), toSlug(), uniqueSlug(), GET()

### Community 11 - "RAG Chunker"
Cohesion: 0.38
Nodes (3): splitProse(), splitWords(), tokenCount()

### Community 12 - "Seed Script"
Cohesion: 0.7
Nodes (4): seed(), slugify(), splitIntoChunks(), stripMdx()

### Community 13 - "Editor AI Assist"
Cohesion: 0.6
Nodes (3): handleDraft(), handleRewrite(), readStream()

### Community 14 - "Middleware & Auth"
Cohesion: 0.5
Nodes (1): middleware()

### Community 17 - "Docker Infrastructure"
Cohesion: 0.67
Nodes (2): adminExists(), POST()

### Community 18 - "MDX Heading Components"
Cohesion: 0.67
Nodes (1): contentSnippet()

### Community 19 - "Article TOC"
Cohesion: 1.0
Nodes (3): Docker Compose Development, Docker Compose Production, DB Extensions Init

### Community 32 - "ESLint Config"
Cohesion: 1.0
Nodes (2): Tech Stack, Spec Constraints

### Community 69 - "PNPM Workspace"
Cohesion: 1.0
Nodes (1): Spec Interfaces

### Community 70 - "Window Icon"
Cohesion: 1.0
Nodes (1): Code of Conduct

### Community 71 - "Vercel Icon"
Cohesion: 1.0
Nodes (1): pnpm Workspace Config

### Community 72 - "File Icon"
Cohesion: 1.0
Nodes (1): Window Icon SVG

### Community 73 - "Next.js Icon"
Cohesion: 1.0
Nodes (1): Vercel Logo SVG

### Community 74 - "Globe Icon"
Cohesion: 1.0
Nodes (1): File Icon SVG

### Community 75 - "DB Migrations (Enum)"
Cohesion: 1.0
Nodes (1): Next.js Logo SVG

### Community 76 - "DB Migrations (Admin)"
Cohesion: 1.0
Nodes (1): Globe Icon SVG

### Community 77 - "Init DB Extensions"
Cohesion: 1.0
Nodes (1): Caveman communication style directive

## Knowledge Gaps
- **30 isolated node(s):** `Tech Stack`, `Spec Constraints`, `Spec Interfaces`, `Spec Tasks`, `Spec Bugs` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Middleware & Auth`** (4 nodes): `middleware()`, `middleware.ts`, `middleware.test.ts`, `makeRequest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Docker Infrastructure`** (4 nodes): `adminExists()`, `GET()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MDX Heading Components`** (3 nodes): `contentSnippet()`, `chat-citations.test.ts`, `content-snippet.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (2 nodes): `Tech Stack`, `Spec Constraints`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PNPM Workspace`** (1 nodes): `Spec Interfaces`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window Icon`** (1 nodes): `Code of Conduct`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel Icon`** (1 nodes): `pnpm Workspace Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Icon`** (1 nodes): `Window Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Icon`** (1 nodes): `Vercel Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe Icon`** (1 nodes): `File Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DB Migrations (Enum)`** (1 nodes): `Next.js Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DB Migrations (Admin)`** (1 nodes): `Globe Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Init DB Extensions`** (1 nodes): `Caveman communication style directive`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Icon()` connect `UI Components & Chat` to `Public Pages & MDX`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `requireAdmin()` connect `API Routes & Provider CRUD` to `Pages API & Slugify`, `AI Provider Discovery`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `unauthorizedResponse()` connect `API Routes & Provider CRUD` to `Pages API & Slugify`, `AI Provider Discovery`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `requireAdmin()` (e.g. with `PATCH()` and `POST()`) actually correct?**
  _`requireAdmin()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `unauthorizedResponse()` (e.g. with `POST()` and `PUT()`) actually correct?**
  _`unauthorizedResponse()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `validateBody()` (e.g. with `PATCH()` and `POST()`) actually correct?**
  _`validateBody()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `isValidUUID()` (e.g. with `GET()` and `PUT()`) actually correct?**
  _`isValidUUID()` has 14 INFERRED edges - model-reasoned connections that need verification._