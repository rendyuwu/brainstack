import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertedValues: unknown[] = [];

vi.mock('@/db', () => ({
  db: {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn((values) => {
        insertedValues.push(values);
        return {
          returning: vi.fn().mockResolvedValue(
            Array.isArray(values)
              ? values.map((value, i) => ({ id: `chunk-${i}`, content: value.content }))
              : []
          ),
        };
      }),
    }),
  },
}));

vi.mock('../embedder', () => ({
  embedChunks: vi.fn().mockResolvedValue(null),
}));

describe('runPublishPipeline', () => {
  beforeEach(() => {
    insertedValues.length = 0;
    vi.clearAllMocks();
  });

  it('persists chunkIndex in document order', async () => {
    const { runPublishPipeline } = await import('../pipeline');

    await runPublishPipeline(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      ['# First', 'alpha', '', '# Second', 'beta'].join('\n')
    );

    const chunks = insertedValues[0] as Array<{ chunkIndex: number; content: string }>;

    expect(chunks).toHaveLength(2);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual([0, 1]);
    expect(chunks[0].content).toContain('# First');
    expect(chunks[1].content).toContain('# Second');
  });

  it('preserves document order when empty chunks are filtered', async () => {
    const { runPublishPipeline } = await import('../pipeline');

    await runPublishPipeline(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      ['```ts', 'const x = 1;', '```', '', 'Plain text after code.'].join('\n')
    );

    const chunks = insertedValues[0] as Array<{ chunkIndex: number; content: string }>;

    expect(chunks).toHaveLength(1);
    expect(chunks[0].chunkIndex).toBe(1);
    expect(chunks[0].content).toBe('Plain text after code.');
  });
});
