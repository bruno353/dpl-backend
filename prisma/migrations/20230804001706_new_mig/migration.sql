-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "executorReview" TEXT,
ADD COLUMN     "metadataReview" TEXT,
ADD COLUMN     "metadataReviewFeedback" TEXT,
ADD COLUMN     "review" TEXT,
ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timestampReview" TEXT;
