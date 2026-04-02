/*
  Warnings:

  - The values [ADMIN,HR,SUPERVISOR,OPERATIONS] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `lastRenewalDate` on the `FinanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `nextRenewalDate` on the `FinanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `siteName` on the `FinanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `FinanceRecord` table. All the data in the column will be lost.
  - Added the required column `siteId` to the `FinanceRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecruitmentProcess" AS ENUM ('Ongoing', 'Completed', 'NotStarted');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'supervisor', 'level1', 'level2', 'level3');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "FinanceRecord" DROP COLUMN "lastRenewalDate",
DROP COLUMN "nextRenewalDate",
DROP COLUMN "siteName",
DROP COLUMN "startDate",
ADD COLUMN     "siteId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "lastRenewalDate" TIMESTAMP(3),
ADD COLUMN     "nextRenewalDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ManpowerItem" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "authorised" INTEGER NOT NULL,
    "deployed" INTEGER,
    "shortage" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManpowerSummary" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "recruitmentProcess" "RecruitmentProcess",
    "responsible" TEXT,
    "cutoffDate" TIMESTAMP(3),
    "total" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerSummary_siteId_key" ON "ManpowerSummary"("siteId");

-- AddForeignKey
ALTER TABLE "ManpowerItem" ADD CONSTRAINT "ManpowerItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManpowerSummary" ADD CONSTRAINT "ManpowerSummary_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
