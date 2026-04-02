-- CreateEnum
CREATE TYPE "ChecklistSource" AS ENUM ('BASIC', 'COMMUNICATION', 'SITE_VISIT', 'TELEPHONIC', 'STORE');

-- CreateTable
CREATE TABLE "ChecklistSubmission" (
    "id" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeText" TEXT,
    "siteVisitConducted" TEXT,
    "siteVisitReason" TEXT,
    "siteName" TEXT,
    "telephonicCalling" TEXT,
    "telephonicSiteName" TEXT,
    "telephonicIncharge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "source" "ChecklistSource" NOT NULL,
    "sectionName" TEXT NOT NULL,
    "questionId" TEXT,
    "questionText" TEXT NOT NULL,
    "siteContext" TEXT,
    "answerValue" TEXT,
    "answerReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChecklistAnswer" ADD CONSTRAINT "ChecklistAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
