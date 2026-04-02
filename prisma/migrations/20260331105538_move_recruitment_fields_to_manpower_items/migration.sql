/*
  Warnings:

  - You are about to drop the `ManpowerSummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ManpowerSummary" DROP CONSTRAINT "ManpowerSummary_siteId_fkey";

-- AlterTable
ALTER TABLE "ManpowerItem" ADD COLUMN     "cutoffDate" TIMESTAMP(3),
ADD COLUMN     "needed" INTEGER DEFAULT 0,
ADD COLUMN     "recruitmentProcess" "RecruitmentProcess",
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "responsible" TEXT;

-- DropTable
DROP TABLE "ManpowerSummary";
