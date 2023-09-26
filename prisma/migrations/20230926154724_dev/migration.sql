-- AlterTable
ALTER TABLE "openmeshDataProviders" ADD COLUMN     "dataCloudLink" TEXT NOT NULL DEFAULT 'www.aws.com',
ADD COLUMN     "dataCloudName" TEXT NOT NULL DEFAULT 'US Virginia RE67243',
ADD COLUMN     "dataGithubLink" TEXT NOT NULL DEFAULT 'www.github.com',
ADD COLUMN     "dataGithubName" TEXT NOT NULL DEFAULT 'Connector',
ADD COLUMN     "dataSpace" TEXT NOT NULL DEFAULT '0 MB',
ADD COLUMN     "downloadCSVLink" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "liveLink" TEXT NOT NULL DEFAULT 'wss://ws.tech.l3a.xyz';
