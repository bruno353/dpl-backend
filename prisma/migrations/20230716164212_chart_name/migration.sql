/*
  Warnings:

  - Added the required column `metricsName` to the `chartData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chartData" ADD COLUMN     "metricsName" TEXT NOT NULL;
