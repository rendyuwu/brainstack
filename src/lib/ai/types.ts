export type ProviderKind = 'openai_compatible' | 'openrouter' | 'litellm_proxy';
export type DiscoveryMode = 'v1-models' | 'openrouter-models' | 'litellm-model-info' | 'static';

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
