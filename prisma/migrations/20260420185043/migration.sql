/*
  Warnings:

  - You are about to drop the `leave_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_reviewer_id_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_user_id_fkey";

-- DropTable
DROP TABLE "leave_requests";

-- DropEnum
DROP TYPE "LeaveStatus";
