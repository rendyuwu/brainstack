# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `master` | ✅ Yes |
| Feature branches | ❌ No |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

### How to Report

1. **Email:** Send details to **github@rendy.dev**
2. **GitHub:** Use [GitHub's private security advisory](https://github.com/rendyuwu/brainstack/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix (Critical) | 24–48 hours |
| Fix (High) | 1 week |
| Fix (Medium/Low) | Next release cycle |

### Disclosure Policy

We follow coordinated disclosure:

1. Reporter submits vulnerability privately
2. We acknowledge and assess
3. We develop and test a fix
4. We release the fix
5. We publicly disclose with credit to the reporter (unless anonymity requested)

## Security Architecture

| Area | Location | Notes |
|------|----------|-------|
| Authentication | `src/lib/auth.ts` | NextAuth.js v5 with JWT sessions, credentials provider |
| Password hashing | `src/lib/auth.ts` | bcryptjs (10 rounds) |
| Route protection | `src/middleware.ts` | Protects `/editor/*` and `/admin/*` routes |
| Authorization | `src/app/admin/` | Admin role required for provider management |
| Input validation | `src/lib/validation.ts` | Zod schemas on all API routes |
| Rate limiting | `src/lib/rate-limiter.ts` | Applied to public API endpoints |
| Database access | `src/db/` | Drizzle ORM (parameterized queries) |
| Secrets | `.env.local` | `AUTH_SECRET`, `DATABASE_URL` — never committed |

## Security-Sensitive Areas

Changes to these areas require extra review:

- `src/lib/auth.ts` — Authentication and session handling
- `src/middleware.ts` — Route protection and authorization
- `src/lib/validation.ts` — Input validation schemas
- `src/lib/rate-limiter.ts` — Rate limiting configuration
- `src/db/schema.ts` — Database schema (especially user/role fields)
- `src/db/meta/` — Database migrations
- `src/app/api/` — API route handlers accepting user input
- `.env.example` — Environment variable template (no secrets)
- `docker/init-db.sql` — Database initialization
