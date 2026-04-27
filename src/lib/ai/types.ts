export const PROVIDER_KINDS = ['openai_compatible', 'openrouter', 'litellm_proxy'] as const;
export const DISCOVERY_MODES = ['v1-models', 'openrouter-models', 'litellm-model-info', 'static'] as const;

export type ProviderKind = (typeof PROVIDER_KINDS)[number];
export type DiscoveryMode = (typeof DISCOVERY_MODES)[number];

export function isProviderKind(value: unknown): value is ProviderKind {
  return typeof value === 'string' && PROVIDER_KINDS.includes(value as ProviderKind);
}

export function isDiscoveryMode(value: unknown): value is DiscoveryMode {
  return typeof value === 'string' && DISCOVERY_MODES.includes(value as DiscoveryMode);
}

export interface ProviderConfig {
  id: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  apiKeySecretRef: string | null;
  defaultHeaders: Record<string, string> | null;
  discoveryMode: DiscoveryMode;
  enabled: boolean;
}

export interface ModelConfig {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string | null;
  supportsChat: boolean;
  supportsResponses: boolean;
  supportsEmbeddings: boolean;
  supportsVision: boolean;
  contextLength: number | null;
}
