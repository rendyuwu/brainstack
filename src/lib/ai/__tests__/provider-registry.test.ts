import { describe, it, expect } from 'vitest';
import { detectCapabilities } from '../provider-registry';
import { isDiscoveryMode, isProviderKind } from '../types';

describe('provider enum guards', () => {
  it('accepts only supported provider kinds', () => {
    expect(isProviderKind('openai_compatible')).toBe(true);
    expect(isProviderKind('openrouter')).toBe(true);
    expect(isProviderKind('litellm_proxy')).toBe(true);
    expect(isProviderKind('anthropic')).toBe(false);
  });

  it('accepts only supported discovery modes', () => {
    expect(isDiscoveryMode('v1-models')).toBe(true);
    expect(isDiscoveryMode('openrouter-models')).toBe(true);
    expect(isDiscoveryMode('litellm-model-info')).toBe(true);
    expect(isDiscoveryMode('static')).toBe(true);
    expect(isDiscoveryMode('unknown')).toBe(false);
  });
});

describe('detectCapabilities', () => {
  it('marks all models as supporting chat', () => {
    expect(detectCapabilities('any-model').supportsChat).toBe(true);
  });

  it('detects GPT-4 responses support', () => {
    const caps = detectCapabilities('gpt-4-turbo');
    expect(caps.supportsResponses).toBe(true);
  });

  it('detects GPT-3.5 responses support', () => {
    const caps = detectCapabilities('gpt-3.5-turbo');
    expect(caps.supportsResponses).toBe(true);
  });

  it('no responses support for non-GPT models', () => {
    expect(detectCapabilities('claude-3-opus').supportsResponses).toBe(false);
  });

  it('detects embedding models', () => {
    expect(detectCapabilities('text-embedding-ada-002').supportsEmbeddings).toBe(true);
    expect(detectCapabilities('embed-english-v3').supportsEmbeddings).toBe(true);
  });

  it('no embeddings for non-embed models', () => {
    expect(detectCapabilities('gpt-4').supportsEmbeddings).toBe(false);
  });

  it('detects vision for gpt-4o', () => {
    expect(detectCapabilities('gpt-4o').supportsVision).toBe(true);
  });

  it('detects vision for claude-3 models', () => {
    expect(detectCapabilities('claude-3-sonnet').supportsVision).toBe(true);
  });

  it('detects vision for gemini models', () => {
    expect(detectCapabilities('gemini-pro').supportsVision).toBe(true);
  });

  it('detects vision keyword', () => {
    expect(detectCapabilities('llava-vision-7b').supportsVision).toBe(true);
  });

  it('no vision for basic models', () => {
    expect(detectCapabilities('llama-2-70b').supportsVision).toBe(false);
  });

  it('contextLength defaults to null', () => {
    expect(detectCapabilities('any-model').contextLength).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(detectCapabilities('GPT-4-TURBO').supportsResponses).toBe(true);
    expect(detectCapabilities('Claude-3-Opus').supportsVision).toBe(true);
  });
});
