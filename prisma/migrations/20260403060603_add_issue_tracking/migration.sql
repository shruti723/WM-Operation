-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'supervisor', 'level1', 'level2', 'level3');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RecruitmentProcess" AS ENUM ('Ongoing', 'Completed', 'NotStarted');

-- CreateEnum
CREATE TYPE "ChecklistSource" AS ENUM ('BASIC', 'COMMUNICATION', 'SITE_VISIT', 'TELEPHONIC', 'STORE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "incharge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRenewalDate" TIMESTAMP(3),
    "nextRenewalDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

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
    "responsible" TEXT,
    "cutoffDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recruitmentProcess" TEXT,

    CONSTRAINT "ManpowerSubmissionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceRecord" (
    "id" TEXT NOT NULL,
    "incharge" TEXT,
    "monthlyBilling" DOUBLE PRECISION,
    "invoiceDate" TIMESTAMP(3),
    "invoiceAmount" DOUBLE PRECISION,
    "invoiceMonth" TEXT,
    "paymentStatus" "PaymentStatus",
    "salaryDate" TIMESTAMP(3),
    "salaryAmount" DOUBLE PRECISION,
    "salaryMonth" TEXT,
    "updatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "FinanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistSubmission" (
    "id" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "date" TIMESTAMP(3),
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
    "sectionName" TEXT NOT NULL,
    "questionId" TEXT,
    "questionText" TEXT NOT NULL,
    "siteContext" TEXT,
    "answerValue" TEXT,
    "answerReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" "ChecklistSource",

    CONSTRAINT "ChecklistAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistComment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorRole" "UserRole" NOT NULL,
    "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "readBySupervisor" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChecklistComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteName_key" ON "Site"("siteName");

-- AddForeignKey
ALTER TABLE "SiteManpower" ADD CONSTRAINT "SiteManpower_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerSubmission" ADD CONSTRAINT "ManpowerSubmission_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerSubmissionItem" ADD CONSTRAINT "ManpowerSubmissionItem_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ManpowerSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistAnswer" ADD CONSTRAINT "ChecklistAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistComment" ADD CONSTRAINT "ChecklistComment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ChecklistSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
