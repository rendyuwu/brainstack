-- T43: persisted chunk order — §V.56
ALTER TABLE "chunks" ADD COLUMN "chunk_index" integer;

WITH latest_revisions AS (
  SELECT DISTINCT ON ("page_id") "page_id", "mdx_source"
  FROM "page_revisions"
  ORDER BY "page_id", "created_at" DESC, "id" DESC
),
ordered AS (
  SELECT c."id",
         row_number() OVER (
           PARTITION BY c."page_id"
           ORDER BY NULLIF(strpos(lr."mdx_source", c."content"), 0), c.ctid
         ) - 1 AS idx
  FROM "chunks" c
  LEFT JOIN latest_revisions lr ON lr."page_id" = c."page_id"
)
UPDATE "chunks"
SET "chunk_index" = ordered.idx
FROM ordered
WHERE "chunks"."id" = ordered."id";

ALTER TABLE "chunks" ALTER COLUMN "chunk_index" SET NOT NULL;
CREATE UNIQUE INDEX "chunks_page_chunk_index_idx" ON "chunks" USING btree ("page_id" uuid_ops, "chunk_index");
