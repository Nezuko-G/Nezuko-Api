-- AlterTable
ALTER TABLE "attendance_settings" ADD COLUMN     "location_attendance_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "require_location" BOOLEAN NOT NULL DEFAULT true;
