import { relations } from "drizzle-orm/relations";
import { pages, assets, chunks, pageRevisions, chunkEmbeddings, users, conversations, messages, pageRelations, pageTags, aiProviders, aiModels, collections } from "./schema";

export const assetsRelations = relations(assets, ({one}) => ({
	page: one(pages, {
		fields: [assets.pageId],
		references: [pages.id]
	}),
}));

export const pagesRelations = relations(pages, ({one, many}) => ({
	assets: many(assets),
	chunks: many(chunks),
	pageRevisions: many(pageRevisions),
	pageRelations_sourcePageId: many(pageRelations, {
		relationName: "pageRelations_sourcePageId_pages_id"
	}),
	pageRelations_targetPageId: many(pageRelations, {
		relationName: "pageRelations_targetPageId_pages_id"
	}),
	pageTags: many(pageTags),
	collection: one(collections, {
		fields: [pages.collectionId],
		references: [collections.id]
	}),
}));

export const chunksRelations = relations(chunks, ({one, many}) => ({
	page: one(pages, {
		fields: [chunks.pageId],
		references: [pages.id]
	}),
	pageRevision: one(pageRevisions, {
		fields: [chunks.revisionId],
		references: [pageRevisions.id]
	}),
	chunkEmbeddings: many(chunkEmbeddings),
}));

export const pageRevisionsRelations = relations(pageRevisions, ({one, many}) => ({
	chunks: many(chunks),
	page: one(pages, {
		fields: [pageRevisions.pageId],
		references: [pages.id]
	}),
}));

export const chunkEmbeddingsRelations = relations(chunkEmbeddings, ({one}) => ({
	chunk: one(chunks, {
		fields: [chunkEmbeddings.chunkId],
		references: [chunks.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
	messages: many(messages),
}));

export const usersRelations = relations(users, ({many}) => ({
	conversations: many(conversations),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
}));

export const pageRelationsRelations = relations(pageRelations, ({one}) => ({
	page_sourcePageId: one(pages, {
		fields: [pageRelations.sourcePageId],
		references: [pages.id],
		relationName: "pageRelations_sourcePageId_pages_id"
	}),
	page_targetPageId: one(pages, {
		fields: [pageRelations.targetPageId],
		references: [pages.id],
		relationName: "pageRelations_targetPageId_pages_id"
	}),
}));

export const pageTagsRelations = relations(pageTags, ({one}) => ({
	page: one(pages, {
		fields: [pageTags.pageId],
		references: [pages.id]
	}),
}));

export const aiModelsRelations = relations(aiModels, ({one}) => ({
	aiProvider: one(aiProviders, {
		fields: [aiModels.providerId],
		references: [aiProviders.id]
	}),
}));

export const aiProvidersRelations = relations(aiProviders, ({many}) => ({
	aiModels: many(aiModels),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	pages: many(pages),
}));