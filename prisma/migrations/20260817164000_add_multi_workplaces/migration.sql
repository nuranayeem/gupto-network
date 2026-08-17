-- Preserve the existing single workplace as the first entry, then move to a structured multi-workplace list.
ALTER TABLE "User" ADD COLUMN "workplaces" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "User"
SET "workplaces" = jsonb_build_array(jsonb_build_object('name', btrim("workplace"), 'url', ''))
WHERE "workplace" IS NOT NULL AND btrim("workplace") <> '';

ALTER TABLE "User" DROP COLUMN "workplace";
