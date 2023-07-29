-- DropForeignKey
ALTER TABLE "application" DROP CONSTRAINT "application_taskId_fkey";

-- AddForeignKey
ALTER TABLE "application" ADD CONSTRAINT "application_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;
