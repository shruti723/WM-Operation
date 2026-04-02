/*
  Warnings:

  - You are about to drop the column `level2SubmittedAt` on the `Site` table. All the data in the column will be lost.
  - You are about to drop the `ManpowerItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ManpowerItem" DROP CONSTRAINT "ManpowerItem_siteId_fkey";

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "level2SubmittedAt";

-- DropTable
DROP TABLE "ManpowerItem";

-- CreateTable
CREATE TABLE "SiteManpower" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "authorised" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteManpower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManpowerSubmission" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "submittedByRole" "UserRole",
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManpowerSubmissionItem" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "authorised" INTEGER NOT NULL,
    "deployed" INTEGER,
    "shortage" INTEGER,
    "needed" INTEGER DEFAULT 0,
    "recruitmentProcess" "RecruitmentProcess",
    "responsible" TEXT,
    "cutoffDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerSubmissionItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteManpower" ADD CONSTRAINT "SiteManpower_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerSubmission" ADD CONSTRAINT "ManpowerSubmission_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerSubmissionItem" ADD CONSTRAINT "ManpowerSubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ManpowerSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
