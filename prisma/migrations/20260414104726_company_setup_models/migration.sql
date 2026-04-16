-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "commercial_reg" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tax_number" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "fiscal_year_start" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_day_start" TEXT NOT NULL DEFAULT '09:00',
    "work_day_end" TEXT NOT NULL DEFAULT '17:00',
    "working_days" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4]::INTEGER[],
    "late_grace_minutes" INTEGER NOT NULL DEFAULT 0,
    "early_leave_grace" INTEGER NOT NULL DEFAULT 0,
    "overtime_threshold" INTEGER NOT NULL DEFAULT 0,
    "rounding_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rounding_minutes" INTEGER,
    "require_biometric" BOOLEAN NOT NULL DEFAULT false,
    "geofence_enabled" BOOLEAN NOT NULL DEFAULT false,
    "geofence_lat" DOUBLE PRECISION,
    "geofence_lng" DOUBLE PRECISION,
    "geofence_radius_m" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_tenant_id_key" ON "company_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_settings_tenant_id_key" ON "attendance_settings"("tenant_id");

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_settings" ADD CONSTRAINT "attendance_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
 