# Graph Report - brainstack  (2026-05-03)

## Corpus Check
- 143 files · ~65,660 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 381 nodes · 626 edges · 26 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 156 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

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

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (29): addManualModel(), deleteProvider(), getProviders(), testModel(), rewriteContent(), DELETE(), GET(), POST() (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (9): Icon(), PublicShell(), SidebarToggle(), ThemeProvider(), useTheme(), useChat(), useKeyboardShortcuts(), applyAppearanceCss() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (19): sitemap(), BlogPage(), CheatsheetsPage(), JsonLd(), Tag(), DiscoverPage(), estimateReadTime(), extractHeadings() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (22): createAIClient(), decryptApiKey(), findChatCandidates(), createProvider(), decryptApiKey(), detectCapabilities(), discoverModels(), getProvider() (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (19): generateDraft(), chatWithFallback(), logAIUsage(), POST(), contentSnippet(), checkRateLimit(), getIP(), detectDuplicates() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (27): BookStack, BrainStack Platform, Graphify knowledge graph integration, Contributing Guide, Spec Format (Caveman Encoding), Product Research and Vision, Admin-only access model (single role), API routes (pages, search, chat, AI, admin, auth) (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (4): closeForm(), fetchEmbeddingStats(), handleEmbeddingAction(), handleSave()

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (15): ai_models Table, ai_providers Table, conversations Table, messages Table, users Table, ai_providers_discovery_mode_check Constraint, ai_providers_kind_check Constraint, Admin Role Default Migration (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (6): POST(), chunkMDX(), splitProse(), splitWords(), tokenCount(), runPublishPipeline()

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (12): assets Table, chunk_embeddings Table, chunks Table, collections Table, page_relations Table, page_revisions Table, page_tags Table, pages Table (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): isPageStatus(), isPageType(), toSlug(), uniqueSlug(), GET(), POST()

### Community 11 - "Community 11"
Cohesion: 0.7
Nodes (4): seed(), slugify(), splitIntoChunks(), stripMdx()

### Community 12 - "Community 12"
Cohesion: 0.6
Nodes (3): handleDraft(), handleRewrite(), readStream()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (1): middleware()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (2): adminExists(), POST()

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (3): Docker Compose Development, Docker Compose Production, DB Extensions Init

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (2): Tech Stack, Spec Constraints

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): Spec Interfaces

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): Code of Conduct

### Community 70 - "Community 70"
Cohesion: 1.0
Nodes (1): pnpm Workspace Config

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): Window Icon SVG

### Community 72 - "Community 72"
Cohesion: 1.0
Nodes (1): Vercel Logo SVG

### Community 73 - "Community 73"
Cohesion: 1.0
Nodes (1): File Icon SVG

### Community 74 - "Community 74"
Cohesion: 1.0
Nodes (1): Next.js Logo SVG

### Community 75 - "Community 75"
Cohesion: 1.0
Nodes (1): Globe Icon SVG

### Community 76 - "Community 76"
Cohesion: 1.0
Nodes (1): Caveman communication style directive

## Knowledge Gaps
- **30 isolated node(s):** `Tech Stack`, `Spec Constraints`, `Spec Interfaces`, `Spec Tasks`, `Spec Bugs` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (4 nodes): `middleware()`, `middleware.ts`, `middleware.test.ts`, `makeRequest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `adminExists()`, `GET()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `Tech Stack`, `Spec Constraints`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `Spec Interfaces`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `Code of Conduct`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `pnpm Workspace Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `Window Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `Vercel Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `File Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `Next.js Logo SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `Globe Icon SVG`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `Caveman communication style directive`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Icon()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `requireAdmin()` connect `Community 0` to `Community 8`, `Community 10`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `unauthorizedResponse()` connect `Community 0` to `Community 8`, `Community 10`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `requireAdmin()` (e.g. with `PATCH()` and `POST()`) actually correct?**
  _`requireAdmin()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 22 inferred relationships involving `unauthorizedResponse()` (e.g. with `POST()` and `PUT()`) actually correct?**
  _`unauthorizedResponse()` has 22 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `validateBody()` (e.g. with `PATCH()` and `POST()`) actually correct?**
  _`validateBody()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `isValidUUID()` (e.g. with `GET()` and `PUT()`) actually correct?**
  _`isValidUUID()` has 14 INFERRED edges - model-reasoned connections that need verification._