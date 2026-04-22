/*
  Warnings:

  - You are about to drop the column `siteId` on the `FinanceRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FinanceRecord" DROP CONSTRAINT "FinanceRecord_siteId_fkey";

-- AlterTable
ALTER TABLE "FinanceRecord" DROP COLUMN "siteId",
ALTER COLUMN "updatedOn" DROP DEFAULT;
