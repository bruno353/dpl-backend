/*
  Warnings:

  - The `active` column on the `speakersRegistrationCalendly` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "speakersRegistrationCalendly" ADD COLUMN     "reschedule" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "active",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
