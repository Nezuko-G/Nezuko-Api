/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,user_id,start_date,end_date]` on the table `leave_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "leave_requests_tenant_id_user_id_start_date_end_date_key" ON "leave_requests"("tenant_id", "user_id", "start_date", "end_date");
