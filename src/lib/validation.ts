import { z } from 'zod';
import { PAGE_TYPES } from '@/lib/pages';
import { PROVIDER_KINDS, DISCOVERY_MODES } from '@/lib/ai/types';
import { NextResponse } from 'next/server';

// ── Helpers ──────────────────────────────────────────────────────────

export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    response: NextResponse.json(
      {
        error: 'Validation failed',
        details: result.error.issues,
      },
      { status: 400 },
    ),
  };
}

export function validateQuery<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    response: NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: result.error.issues,
      },
      { status: 400 },
    ),
  };
}

// ── Pages ────────────────────────────────────────────────────────────

const pageTypeEnum = z.enum(PAGE_TYPES);

export const createPageSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  mdx_source: z.string().optional().default(''),
  summary: z.string().max(1000).nullable().optional(),
  type: pageTypeEnum.optional().default('tutorial'),
  collection_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().min(1).max(100)).max(50).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  mdx_source: z.string().optional(),
  summary: z.string().max(1000).nullable().optional(),
  type: pageTypeEnum.optional(),
  collection_id: z.string().uuid().nullable().optional(),
});

// ── Tags ─────────────────────────────────────────────────────────────

export const updateTagsSchema = z.object({
  tags: z.array(z.string().min(1, 'Tag cannot be empty').max(100)).max(50),
});

// ── Relations ────────────────────────────────────────────────────────

const relationTypeEnum = z.enum(['related', 'prerequisite', 'see-also']);

export const createRelationSchema = z.object({
  targetPageId: z.string().uuid('targetPageId must be a valid UUID'),
  relationType: relationTypeEnum,
});

export const deleteRelationSchema = z.object({
  relationId: z.string().uuid('relationId must be a valid UUID'),
});

// ── Assets ───────────────────────────────────────────────────────────

export const deleteAssetSchema = z.object({
  assetId: z.string().uuid('assetId must be a valid UUID'),
});

// ── Chat ─────────────────────────────────────────────────────────────

const scopeTypeEnum = z.enum(['page', 'collection', 'site']);

export const chatSchema = z.object({
  message: z.string().min(1, 'message is required').max(10000),
  conversationId: z.string().uuid().optional(),
  scopeType: scopeTypeEnum.optional().default('site'),
  scopeId: z.string().uuid().nullable().optional(),
});

// ── AI Draft ─────────────────────────────────────────────────────────

export const aiDraftSchema = z.object({
  idea: z.string().min(1, 'idea is required').max(5000),
  imageUrl: z.string().url().optional(),
});

// ── AI Rewrite ───────────────────────────────────────────────────────

const rewriteStyleEnum = z.enum(['cheatsheet', 'beginner', 'advanced']);

export const aiRewriteSchema = z.object({
  content: z.string().min(1, 'content is required').max(50000, 'content too long (max 50,000 chars)'),
  style: rewriteStyleEnum,
});

// ── Admin Providers ──────────────────────────────────────────────────

const providerKindEnum = z.enum(PROVIDER_KINDS);
const discoveryModeEnum = z.enum(DISCOVERY_MODES);

export const createProviderSchema = z.object({
  label: z.string().min(1, 'label is required').max(200),
  kind: providerKindEnum,
  baseUrl: z.string().url('baseUrl must be a valid URL'),
  apiKeySecretRef: z.string().nullable().optional(),
  defaultHeaders: z.record(z.string(), z.string()).nullable().optional(),
  discoveryMode: discoveryModeEnum.optional().default('v1-models'),
  enabled: z.boolean().optional().default(true),
});

export const updateProviderSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  kind: providerKindEnum.optional(),
  baseUrl: z.string().url().optional(),
  apiKeySecretRef: z.string().nullable().optional(),
  defaultHeaders: z.record(z.string(), z.string()).nullable().optional(),
  discoveryMode: discoveryModeEnum.optional(),
  enabled: z.boolean().optional(),
});

// ── Admin Models ─────────────────────────────────────────────────────

export const addModelSchema = z.object({
  modelId: z.string().min(1, 'modelId is required').max(200),
  supportsChat: z.boolean().optional().default(true),
  supportsEmbeddings: z.boolean().optional().default(false),
  supportsVision: z.boolean().optional().default(false),
  supportsResponses: z.boolean().optional().default(false),
  contextLength: z.number().int().positive().nullable().optional(),
  test: z.boolean().optional().default(false),
});

// ── Search ───────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(500),
});

// ── Setup ────────────────────────────────────────────────────────────

export const setupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  name: z.string().min(1, 'Name is required').max(200),
});

// ── Type exports ─────────────────────────────────────────────────────

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type UpdateTagsInput = z.infer<typeof updateTagsSchema>;
export type CreateRelationInput = z.infer<typeof createRelationSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type AiDraftInput = z.infer<typeof aiDraftSchema>;
export type AiRewriteInput = z.infer<typeof aiRewriteSchema>;
export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type AddModelInput = z.infer<typeof addModelSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
