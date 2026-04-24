-- CreateEnum
CREATE TYPE "InsurancePlanType" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "DependentRelation" AS ENUM ('SPOUSE', 'CHILD', 'PARENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "salary" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "insurance_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InsurancePlanType" NOT NULL,
    "coverage_details" TEXT,
    "salary_percentage" DOUBLE PRECISION NOT NULL,
    "max_dependents" INTEGER NOT NULL DEFAULT 4,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "monthly_cost" DOUBLE PRECISION NOT NULL,
    "salary_at_enrollment" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_dependents" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "DependentRelation" NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "national_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_dependents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_plans_tenant_id_name_key" ON "insurance_plans"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_enrollments_tenant_id_user_id_plan_id_key" ON "insurance_enrollments"("tenant_id", "user_id", "plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_dependents_enrollment_id_national_id_key" ON "insurance_dependents"("enrollment_id", "national_id");

-- AddForeignKey
ALTER TABLE "insurance_plans" ADD CONSTRAINT "insurance_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_enrollments" ADD CONSTRAINT "insurance_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_enrollments" ADD CONSTRAINT "insurance_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_enrollments" ADD CONSTRAINT "insurance_enrollments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "insurance_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_dependents" ADD CONSTRAINT "insurance_dependents_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "insurance_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;