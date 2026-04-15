-- Ensure hidden timestamp columns in settings tables have defaults
-- so inserts from Prisma models (which don't include these columns) do not fail.

ALTER TABLE "company_settings"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "attendance_settings"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
