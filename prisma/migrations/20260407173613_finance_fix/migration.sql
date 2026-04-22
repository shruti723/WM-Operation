/*
  Warnings:

  - Changed the type of `authorRole` on the `ChecklistComment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `siteName` to the `FinanceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'account1';
ALTER TYPE "UserRole" ADD VALUE 'account2';

-- AlterTable
ALTER TABLE "ChecklistComment" DROP COLUMN "authorRole",
ADD COLUMN     "authorRole" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ChecklistSubmission" ADD COLUMN     "issueCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "okCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "FinanceRecord" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "currentStage" TEXT NOT NULL DEFAULT 'level1',
ADD COLUMN     "lastRenewalDate" TIMESTAMP(3),
ADD COLUMN     "nextRenewalDate" TIMESTAMP(3),
ADD COLUMN     "siteName" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "updatedBy" TEXT;

-- CreateTable
CREATE TABLE "ChecklistIssue" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistIssue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChecklistIssue" ADD CONSTRAINT "ChecklistIssue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
