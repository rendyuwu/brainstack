-- T27: admin-only safeguard — §V.32
-- Change default role from 'editor' to 'admin'
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';

-- Normalize existing 'editor' rows to 'admin'
-- (editor role no longer exists; all users must be admin)
UPDATE "users" SET "role" = 'admin' WHERE "role" = 'editor';
