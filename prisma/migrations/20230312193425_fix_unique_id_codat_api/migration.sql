/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `codatAPIConnection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "codatAPIConnection_apiKey_key" ON "codatAPIConnection"("apiKey");
