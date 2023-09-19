-- CreateTable
CREATE TABLE "openmeshDataProviders" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "sql" TEXT,

    CONSTRAINT "openmeshDataProviders_pkey" PRIMARY KEY ("id")
);
