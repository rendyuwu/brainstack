import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compare, hash } from 'bcryptjs';

// ── Mocks ───────────────────────────────────────────────────────────

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockSelectResult = vi.fn();
const mockUpdateSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectResult(),
        }),
      }),
    }),
    update: () => ({
      set: mockUpdateSet,
    }),
  },
}));

vi.mock('@/db/schema', () => ({
  users: { id: 'id', passwordHash: 'password_hash' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

// ── Helpers ─────────────────────────────────────────────────────────

async function callPATCH(body: Record<string, unknown>) {
  const { PATCH } = await import('@/app/api/account/password/route');
  const request = new Request('http://localhost/api/account/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return PATCH(request);
}

// ── Tests ───────────────────────────────────────────────────────────

describe('PATCH /api/account/password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  // V30: require authenticated session
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await callPATCH({ currentPassword: 'old', newPassword: 'newpass123' });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 when session has no user', async () => {
    mockAuth.mockResolvedValue({ user: null });
    const res = await callPATCH({ currentPassword: 'old', newPassword: 'newpass123' });
    expect(res.status).toBe(401);
  });

  // Validation: missing fields
  it('returns 400 when currentPassword missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const res = await callPATCH({ newPassword: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPassword too short', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const res = await callPATCH({ currentPassword: 'old', newPassword: 'short' });
    expect(res.status).toBe(400);
  });

  // V28: verify current password before update
  it('returns 400 when current password is wrong', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockSelectResult.mockResolvedValue([{ passwordHash: '$2a$12$hashed' }]);
    (compare as any).mockResolvedValue(false);

    const res = await callPATCH({ currentPassword: 'wrong', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
    const data = await res.json();
    // V31: generic error message
    expect(data.error).toBe('Password change failed');
  });

  // V29: new password must differ from current
  it('returns 400 when new password same as current', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockSelectResult.mockResolvedValue([{ passwordHash: '$2a$12$hashed' }]);
    (compare as any)
      .mockResolvedValueOnce(true)   // current password valid
      .mockResolvedValueOnce(true);  // new password matches current

    const res = await callPATCH({ currentPassword: 'same', newPassword: 'samepass1' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('New password must be different from current password');
  });

  // Happy path
  it('returns 200 and updates password on valid change', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockSelectResult.mockResolvedValue([{ passwordHash: '$2a$12$hashed' }]);
    (compare as any)
      .mockResolvedValueOnce(true)    // current password valid
      .mockResolvedValueOnce(false);  // new password differs
    (hash as any).mockResolvedValue('$2a$12$newhash');

    const res = await callPATCH({ currentPassword: 'oldpass1', newPassword: 'newpass123' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(hash).toHaveBeenCalledWith('newpass123', 12);
    expect(mockUpdateSet).toHaveBeenCalledWith({ passwordHash: '$2a$12$newhash' });
  });

  // V31: user not found returns generic error
  it('returns 400 when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockSelectResult.mockResolvedValue([]);

    const res = await callPATCH({ currentPassword: 'old', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Password change failed');
  });
});
