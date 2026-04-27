import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compare } from 'bcryptjs';

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

const mockSelectResult = vi.fn();
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectResult(),
        }),
      }),
    }),
  },
}));

vi.mock('next-auth', () => {
  let capturedAuthorize: any;
  return {
    default: (config: any) => {
      capturedAuthorize = config.providers[0].authorize;
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
      };
    },
    _getAuthorize: () => capturedAuthorize,
  };
});

vi.mock('next-auth/providers/credentials', () => ({
  default: (opts: any) => opts,
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('@/db/schema', () => ({
  users: { email: 'email' },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2a$10$hashedpassword',
  name: 'Test User',
  role: 'editor',
};

describe('auth authorize', () => {
  let authorize: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    await import('../auth');
    const nextAuthMod = await import('next-auth') as any;
    authorize = nextAuthMod._getAuthorize();
  });

  it('returns null when credentials missing', async () => {
    const result = await authorize({});
    expect(result).toBeNull();
  });

  it('returns null when email missing', async () => {
    const result = await authorize({ password: 'pass' });
    expect(result).toBeNull();
  });

  it('returns null when user not found in DB', async () => {
    mockSelectResult.mockResolvedValue([]);
    const result = await authorize({
      email: 'nobody@example.com',
      password: 'pass',
    });
    expect(result).toBeNull();
  });

  it('returns null when password is wrong', async () => {
    mockSelectResult.mockResolvedValue([mockUser]);
    (compare as any).mockResolvedValue(false);
    const result = await authorize({
      email: 'test@example.com',
      password: 'wrong',
    });
    expect(result).toBeNull();
  });

  it('returns user object when credentials valid', async () => {
    mockSelectResult.mockResolvedValue([mockUser]);
    (compare as any).mockResolvedValue(true);
    const result = await authorize({
      email: 'test@example.com',
      password: 'correct',
    });
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'editor',
    });
  });
});
