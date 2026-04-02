/*
  Warnings:

  - The `recruitmentProcess` column on the `ManpowerSubmissionItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ManpowerSubmissionItem" DROP COLUMN "recruitmentProcess",
ADD COLUMN     "recruitmentProcess" TEXT;
