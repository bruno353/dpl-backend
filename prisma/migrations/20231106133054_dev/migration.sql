-- AlterTable
ALTER TABLE "openmeshDataProviders" ALTER COLUMN "dataCloudLink" DROP NOT NULL,
ALTER COLUMN "dataCloudLink" DROP DEFAULT,
ALTER COLUMN "dataCloudName" DROP NOT NULL,
ALTER COLUMN "dataCloudName" DROP DEFAULT,
ALTER COLUMN "dataGithubLink" DROP NOT NULL,
ALTER COLUMN "dataGithubLink" DROP DEFAULT,
ALTER COLUMN "dataGithubName" DROP NOT NULL,
ALTER COLUMN "dataGithubName" DROP DEFAULT;
