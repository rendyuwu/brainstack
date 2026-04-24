The product I’d build is **a knowledge-first IT publishing platform**, not a normal blog with a chatbot glued on. Think **BookStack structure + blog distribution + AI workspace**: one canonical knowledge page can be rendered as a tutorial, a short tip, a cheatsheet, or part of a topic stack. That direction matches BookStack’s core model of **books → chapters → pages** and its emphasis on search plus direct paragraph linking, while Next.js already supports MDX and server-side metadata generation for SEO-friendly pages. ([BookStack][1])

## Product story

A user lands from Google on “Docker Compose for local dev.” They read the polished article. Then they click **Ask this post**, paste their own error screenshot, and choose **“adapt this to my use case: Ubuntu + Traefik + CI deploy.”** The AI answers with citations back to your existing content, offers a shorter cheatsheet version, and suggests the next 2 pages they should read. Over time, your site stops behaving like a reverse-chronological blog and starts behaving like a **living IT handbook**.

That is the right wedge for IT topics because tutorials, tips, and cheatsheets are naturally related. BookStack’s content hierarchy, paragraph links, search, and reusable page templates are a strong precedent for treating knowledge as structured pages instead of isolated posts. ([BookStack][2])

## What to build

### 1. Three public surfaces on top of one content model

Build one canonical `page` entity, then render it in three ways:

* **Article view**: long-form blog/tutorial.
* **Stack view**: docs/wiki tree by topic.
* **Cheatsheet view**: compressed reference version.

That lets you publish SEO-friendly pages while also giving users a “bookstack with AI brain” experience.

### 2. AI authoring features that feel native

The best first AI features are:

* **Idea → outline → draft**
  User gives rough idea, audience, skill level, target stack, and desired format. The AI creates outline first, then sections, then title/meta/summary.

* **Image → tutorial / explanation**
  User uploads screenshot, architecture diagram, terminal output, or UI capture. The AI turns it into a tutorial, troubleshooting guide, or annotated explanation. OpenRouter’s chat format supports image input using `image_url` parts with either URLs or base64, so this fits well with your “idea + image” requirement. ([OpenRouter][3])

* **Use-case rewrite**
  “Rewrite this post for beginners,” “rewrite for Docker Swarm instead of Kubernetes,” “turn this article into a checklist,” “make this a cheatsheet.”

* **Ask this post / ask this topic / ask the whole site**
  Same chat UI, just different retrieval scope.

* **Duplicate detector before publish**
  When an editor creates a new draft, show “this overlaps 72% with these 3 existing posts.”

### 3. Multimodal knowledge, not just text

A nice differentiator is **indexing both text and images inside your content**. OpenRouter’s embeddings API supports text embeddings, image embeddings, and combined text+image input, so later you can support queries like “find the article with the Nginx reverse proxy diagram” or “which post had that Kubernetes networking chart?” ([OpenRouter][4])

## The technical shape I recommend

### Content system

Use a **custom app**, not a plugin-heavy blog CMS. Your core entities should be:

* `collections` or `books`
* `pages`
* `page_revisions`
* `page_relations` (`prerequisite`, `related`, `same-topic`, `supersedes`)
* `assets`
* `chunks`
* `chunk_embeddings`
* `conversations`
* `messages`
* `citations`

For the editor, I would store **canonical Markdown/MDX in the database** and render with Next.js. If you want a richer editor later, Tiptap is a good upgrade path because it is headless and already exposes AI/collaboration-oriented extensions. ([Next.js][5])

### Frontend/rendering

Use **Next.js App Router** with MDX rendering and metadata generation. That gives you good SEO fundamentals, OG/social metadata, and a clean split between public content routes and editor routes. Next.js explicitly supports MDX content and server-side metadata generation. ([Next.js][5])

Suggested routes:

* `/blog/[slug]`
* `/stack/[collectionSlug]/[pageSlug]`
* `/cheatsheets/[slug]`
* `/ask`
* `/editor/pages/[id]`
* `/admin/ai/providers`

### AI layer: make custom OpenAI-compatible URLs a first-class feature

This is the most important design choice given your update.

Do **not** hardcode “OpenAI” as a provider. Build a **provider registry** where every provider record has:

```ts
type ProviderConfig = {
  id: string
  label: string
  kind: 'openai_compatible' | 'openrouter' | 'litellm_proxy'
  baseURL: string
  apiKeySecretRef: string
  defaultHeaders?: Record<string, string>
  defaultModel?: string
  discoveryMode: 'static' | 'v1-models' | 'openrouter-models' | 'litellm-model-info'
  capabilities?: {
    chat: boolean
    responses: boolean
    embeddings: boolean
    vision: boolean
  }
}
```

Why this works:

* OpenRouter’s docs explicitly show using the **OpenAI SDK with a custom `baseURL`** pointed at `https://openrouter.ai/api/v1`. ([OpenRouter][6])
* LiteLLM’s OpenAI-compatible docs use **`api_base`** for custom endpoints and show how to call chat and embeddings against a custom OpenAI-compatible URL. They also say **do not append endpoint suffixes yourself**, because the OpenAI client adds them. ([LiteLLM][7])
* LiteLLM proxy can expose a single OpenAI-like endpoint and supports `/v1/models`, `/model/info`, virtual keys, spend tracking, and budgets. ([LiteLLM][8])
* OpenRouter also gives you provider routing and fallback behavior across providers. ([OpenRouter][9])

### A practical compatibility rule

Make **Chat Completions** your required baseline for all providers, and implement **Responses API** as an optional adapter.

Why: OpenAI recommends Responses for new projects, and OpenRouter now has an OpenAI-compatible Responses API, but OpenRouter labels it **beta**, and LiteLLM may bridge `/responses` back to `/chat/completions` for providers that do not support Responses natively. The safest architecture is to keep your own normalized internal request format and map it to the best endpoint per provider. ([OpenAI Developers][10])

My recommendation:

* Internal app format = your own `messages + parts` schema
* Required provider support = `/v1/chat/completions`
* Recommended provider support = `/v1/embeddings`
* Optional provider support = `/v1/responses`

Also separate these provider roles:

* **generation provider**
* **embedding provider**
* **optional rerank provider**

Do not assume the same model/provider should do all three.

### Capability-aware UI

Use provider/model discovery so the UI can enable or disable features automatically:

* OpenRouter’s model metadata includes fields like context length, supported parameters, and architecture/input modalities. ([OpenRouter][11])
* LiteLLM proxy exposes `/v1/models` and `/model/info` for model discovery and metadata. ([LiteLLM][8])

That means your admin UI can do this:

* If model supports image input → show image upload in drafting UI
* If model supports embeddings → allow it for indexing
* If provider lacks embeddings → require a separate embedding model
* If provider lacks Responses → silently use Chat Completions adapter

## RAG design

### MVP: keep retrieval in Postgres

For the first version, I would **not** add a separate vector DB yet.

Use:

* PostgreSQL full-text search for keyword matching
* `pgvector` for semantic search
* Reciprocal Rank Fusion to combine them

This is a very solid MVP path because Supabase documents the hybrid Postgres pattern directly with `tsvector` + `pgvector`, PostgreSQL provides native FTS parsing/ranking/highlighting, and pgvector lets you store vectors with the rest of your relational data. ([Supabase][12])

Suggested chunk metadata:

* `page_id`
* `revision_id`
* `anchor_id`
* `heading_path`
* `content`
* `content_type` (`paragraph`, `code`, `list`, `callout`, `image_caption`)
* `tags`
* `product_versions`
* `updated_at`

### Retrieval flow

1. User asks question
2. Optional query rewrite
3. Run lexical + semantic retrieval in parallel
4. Fuse with RRF
5. Rerank top results
6. Answer with citations to anchors/headings
7. Suggest related pages

For IT content, I’d chunk by **section headings first**, then by token window inside each section. Keep code blocks separate from prose.

### Later: move to Qdrant if you outgrow Postgres retrieval

When your corpus gets large or retrieval quality becomes the bottleneck, move the retrieval layer to Qdrant. Qdrant documents **hybrid dense+sparse retrieval**, RRF fusion, and more advanced reranking setups using BM25 plus ColBERT-style late interaction. ([Qdrant][13])

So the upgrade path is:

* **MVP**: Postgres hybrid search
* **V2+**: Qdrant for dense+sparse+rereanking
* Keep your app code retrieval-agnostic behind one `searchKnowledge()` interface

## The MVP I would actually ship

Keep v1 narrow:

1. Public read-only site with tutorial/tip/cheatsheet pages
2. Editor auth
3. Create/edit/publish page
4. AI draft from idea
5. AI draft from image + idea
6. Post publish triggers chunking + embedding job
7. Ask-this-post and Ask-the-site chat with citations
8. Admin page for custom OpenAI-compatible providers and models
9. Usage logging, rate limiting, and model cost visibility

Things I would **not** do in MVP:

* team collaboration
* user-generated public content
* marketplace/plugins
* image generation
* personalized long-term memory
* complex multi-tenant billing

## Concrete schema starter

```sql
pages(
  id uuid pk,
  collection_id uuid null,
  parent_page_id uuid null,
  type text check (type in ('tutorial','tip','cheatsheet','note')),
  title text,
  slug text unique,
  summary text,
  mdx_source text,
  status text check (status in ('draft','published','archived')),
  published_at timestamptz,
  updated_at timestamptz
)

page_revisions(
  id uuid pk,
  page_id uuid,
  mdx_source text,
  plain_text text,
  created_at timestamptz
)

assets(
  id uuid pk,
  page_id uuid,
  kind text,
  storage_url text,
  alt_text text,
  extracted_text text
)

chunks(
  id uuid pk,
  page_id uuid,
  revision_id uuid,
  anchor_id text,
  heading_path text[],
  content text,
  content_type text,
  fts tsvector
)

chunk_embeddings(
  chunk_id uuid,
  embedding_model text,
  embedding vector(1536) -- pick one fixed embedding dimension for MVP
)

ai_providers(
  id uuid pk,
  label text,
  kind text,
  base_url text,
  api_key_secret_ref text,
  default_headers jsonb,
  discovery_mode text,
  enabled boolean
)

ai_models(
  id uuid pk,
  provider_id uuid,
  model_id text,
  supports_chat boolean,
  supports_responses boolean,
  supports_embeddings boolean,
  supports_vision boolean
)

conversations(
  id uuid pk,
  scope_type text, -- page | collection | site
  scope_id uuid null,
  created_at timestamptz
)

messages(
  id uuid pk,
  conversation_id uuid,
  role text,
  content jsonb,
  citations jsonb,
  created_at timestamptz
)
```

## Build order for Claude Code / Codex

Give the agent these tasks one by one, not all at once:

1. **Scaffold app + DB + auth**
2. **Implement content model and public rendering**
3. **Implement provider registry with custom `baseURL`**
4. **Implement AI draft endpoint**
5. **Implement publish → chunk → embed pipeline**
6. **Implement hybrid search**
7. **Implement chat with citations**
8. **Add admin telemetry, cost controls, and tests**

## Prompt to hand to Claude Code or Codex

```text
Build a production-ready MVP called brainstack. Noa is the AI name.

Goal:
Create a knowledge-first IT publishing platform that combines a blog, wiki/docs tree, cheatsheets, AI-assisted writing, and RAG chat over published content.

Core product rules:
- Canonical content unit is a page, not a post.
- A page can render as article view, stack/docs view, or cheatsheet view.
- Public users can read pages and chat with published knowledge.
- Editors can draft pages manually or with AI.
- AI must support OpenAI-compatible providers with custom base URLs.
- Must work with OpenRouter and LiteLLM proxy patterns.
- Do not hardcode a single model vendor.

Required stack:
- Next.js App Router + TypeScript
- PostgreSQL
- pgvector for MVP retrieval
- Server-side AI calls only
- Streaming chat responses
- MDX or markdown storage in DB

Required features:
1. Public routes:
   - /blog/[slug]
   - /stack/[collection]/[slug]
   - /cheatsheets/[slug]
   - /ask
2. Editor routes:
   - create/edit/publish page
3. Admin AI routes:
   - create provider
   - test provider connection
   - discover models
   - set default generation and embedding models
4. AI authoring:
   - draft from idea
   - draft from image + idea
   - rewrite existing page into cheatsheet
5. RAG:
   - chunk published pages by headings
   - store lexical and vector search fields
   - hybrid retrieval with keyword + semantic search
   - answer with citations to page anchors/headings
6. Chat scopes:
   - ask this page
   - ask this collection
   - ask the full site

Architecture rules:
- Create ProviderConfig abstraction with baseURL, API key secret ref, headers, discovery mode, and capabilities.
- Internal request format must be provider-neutral.
- Chat Completions support is mandatory.
- Responses API support is optional per provider.
- Generation provider and embedding provider must be configurable separately.
- Store conversation state in app DB; do not rely on provider-side state.
- AI answers about site knowledge must include citations or say there is insufficient evidence.

Deliverables:
- project structure
- migrations/schema
- seed data
- provider registry
- public rendering
- editor UI
- publish pipeline
- retrieval service
- chat service
- tests for provider adapter and retrieval
- Docker compose for local development

Start with:
1. project skeleton
2. DB schema and migrations
3. provider registry + test connection endpoint
4. page CRUD + public rendering
Then pause and summarize what is implemented before continuing.
```

The sharpest version of this idea is: **build a public IT knowledge library where every page is both readable by humans and operable by AI**. That is much more defensible than “another AI blog.”

[1]: https://www.bookstackapp.com/docs/user/content-overview/ "https://www.bookstackapp.com/docs/user/content-overview/"
[2]: https://www.bookstackapp.com/ "https://www.bookstackapp.com/"
[3]: https://openrouter.ai/docs/guides/overview/multimodal/images "https://openrouter.ai/docs/guides/overview/multimodal/images"
[4]: https://openrouter.ai/docs/api/reference/embeddings "https://openrouter.ai/docs/api/reference/embeddings"
[5]: https://nextjs.org/docs/pages/guides/mdx "https://nextjs.org/docs/pages/guides/mdx"
[6]: https://openrouter.ai/docs/guides/community/openai-sdk "https://openrouter.ai/docs/guides/community/openai-sdk"
[7]: https://docs.litellm.ai/docs/providers/openai_compatible "https://docs.litellm.ai/docs/providers/openai_compatible"
[8]: https://docs.litellm.ai/docs/proxy/model_management "https://docs.litellm.ai/docs/proxy/model_management"
[9]: https://openrouter.ai/docs/guides/routing/model-fallbacks "https://openrouter.ai/docs/guides/routing/model-fallbacks"
[10]: https://developers.openai.com/api/docs/guides/migrate-to-responses?utm_source=chatgpt.com "Migrate to the Responses API | OpenAI API"
[11]: https://openrouter.ai/docs/guides/overview/models "https://openrouter.ai/docs/guides/overview/models"
[12]: https://supabase.com/docs/guides/ai/hybrid-search?utm_source=chatgpt.com "Hybrid search | Supabase Docs"
[13]: https://qdrant.tech/documentation/search/hybrid-queries/ "https://qdrant.tech/documentation/search/hybrid-queries/"

