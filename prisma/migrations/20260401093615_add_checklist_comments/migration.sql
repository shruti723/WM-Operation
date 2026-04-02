/*
  Warnings:

  - The `source` column on the `ChecklistAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ChecklistAnswer" DROP COLUMN "source",
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "ChecklistSubmission" ALTER COLUMN "date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ChecklistComment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChecklistComment" ADD CONSTRAINT "ChecklistComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
