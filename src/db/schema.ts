import { pgTable, foreignKey, uuid, text, timestamp, index, vector, jsonb, unique, integer, boolean, uniqueIndex, customType } from "drizzle-orm/pg-core"

const tsvector = customType<{ data: string }>({
  dataType() { return 'tsvector'; },
});



export const assets = pgTable("assets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id"),
	kind: text().notNull(),
	storageUrl: text("storage_url").notNull(),
	altText: text("alt_text"),
	extractedText: text("extracted_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "assets_page_id_pages_id_fk"
		}).onDelete("cascade"),
]);

export const chunks = pgTable("chunks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id").notNull(),
	revisionId: uuid("revision_id"),
	anchorId: text("anchor_id"),
	headingPath: text("heading_path").array(),
	content: text().notNull(),
	contentType: text("content_type").notNull(),
	fts: tsvector("fts"),
}, (table) => [
	index("chunks_page_idx").using("btree", table.pageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "chunks_page_id_pages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.revisionId],
			foreignColumns: [pageRevisions.id],
			name: "chunks_revision_id_page_revisions_id_fk"
		}),
]);

export const chunkEmbeddings = pgTable("chunk_embeddings", {
	chunkId: uuid("chunk_id").notNull(),
	embeddingModel: text("embedding_model").notNull(),
	embedding: vector({ dimensions: 1536 }),
}, (table) => [
	index("chunk_embeddings_chunk_idx").using("btree", table.chunkId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.chunkId],
			foreignColumns: [chunks.id],
			name: "chunk_embeddings_chunk_id_chunks_id_fk"
		}).onDelete("cascade"),
]);

export const pageRevisions = pgTable("page_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id").notNull(),
	mdxSource: text("mdx_source").notNull(),
	plainText: text("plain_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "page_revisions_page_id_pages_id_fk"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	scopeType: text("scope_type").notNull(),
	scopeId: uuid("scope_id"),
	userId: uuid("user_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_user_id_users_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	role: text().notNull(),
	content: jsonb().notNull(),
	citations: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_conversation_idx").using("btree", table.conversationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
]);

export const pageRelations = pgTable("page_relations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sourcePageId: uuid("source_page_id").notNull(),
	targetPageId: uuid("target_page_id").notNull(),
	relationType: text("relation_type").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sourcePageId],
			foreignColumns: [pages.id],
			name: "page_relations_source_page_id_pages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetPageId],
			foreignColumns: [pages.id],
			name: "page_relations_target_page_id_pages_id_fk"
		}).onDelete("cascade"),
]);

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	icon: text(),
	color: text(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("collections_slug_unique").on(table.slug),
]);

export const aiProviders = pgTable("ai_providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: text().notNull(),
	kind: text().notNull(),
	baseUrl: text("base_url").notNull(),
	apiKeySecretRef: text("api_key_secret_ref"),
	defaultHeaders: jsonb("default_headers"),
	discoveryMode: text("discovery_mode").default('v1-models').notNull(),
	enabled: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	name: text().notNull(),
	role: text().default('editor').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const pageTags = pgTable("page_tags", {
	pageId: uuid("page_id").notNull(),
	tag: text().notNull(),
}, (table) => [
	index("page_tags_tag_idx").using("btree", table.tag.asc().nullsLast().op("text_ops")),
	uniqueIndex("page_tags_unique_idx").using("btree", table.pageId.asc().nullsLast().op("text_ops"), table.tag.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "page_tags_page_id_pages_id_fk"
		}).onDelete("cascade"),
]);

export const aiModels = pgTable("ai_models", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: uuid("provider_id").notNull(),
	modelId: text("model_id").notNull(),
	displayName: text("display_name"),
	supportsChat: boolean("supports_chat").default(true).notNull(),
	supportsResponses: boolean("supports_responses").default(false).notNull(),
	supportsEmbeddings: boolean("supports_embeddings").default(false).notNull(),
	supportsVision: boolean("supports_vision").default(false).notNull(),
	contextLength: integer("context_length"),
}, (table) => [
	uniqueIndex("ai_models_provider_model_idx").using("btree", table.providerId.asc().nullsLast().op("text_ops"), table.modelId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [aiProviders.id],
			name: "ai_models_provider_id_ai_providers_id_fk"
		}).onDelete("cascade"),
]);

export const pages = pgTable("pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id"),
	parentPageId: uuid("parent_page_id"),
	type: text().default('tutorial').notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	summary: text(),
	mdxSource: text("mdx_source"),
	status: text().default('draft').notNull(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("pages_collection_idx").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("pages_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "pages_collection_id_collections_id_fk"
		}),
	unique("pages_slug_unique").on(table.slug),
]);
