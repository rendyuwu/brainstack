import { describe, it, expect } from 'vitest';
import { chatSchema } from '../validation';

describe('chatSchema', () => {
  it('accepts valid message with defaults', () => {
    const result = chatSchema.safeParse({ message: 'hello' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scopeType).toBe('site');
    }
  });

  it('rejects empty message', () => {
    const result = chatSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing message', () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts null conversationId', () => {
    const result = chatSchema.safeParse({ message: 'hello', conversationId: null });
    expect(result.success).toBe(true);
  });

  it('accepts undefined conversationId', () => {
    const result = chatSchema.safeParse({ message: 'hello' });
    expect(result.success).toBe(true);
  });

  it('accepts valid UUID conversationId', () => {
    const result = chatSchema.safeParse({
      message: 'hello',
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID conversationId', () => {
    const result = chatSchema.safeParse({
      message: 'hello',
      conversationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null scopeId', () => {
    const result = chatSchema.safeParse({ message: 'hello', scopeId: null });
    expect(result.success).toBe(true);
  });

  it('accepts valid scopeType values', () => {
    for (const scopeType of ['page', 'collection', 'site']) {
      const result = chatSchema.safeParse({ message: 'hello', scopeType });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid scopeType', () => {
    const result = chatSchema.safeParse({ message: 'hello', scopeType: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects message exceeding max length', () => {
    const result = chatSchema.safeParse({ message: 'a'.repeat(10001) });
    expect(result.success).toBe(false);
  });
});
