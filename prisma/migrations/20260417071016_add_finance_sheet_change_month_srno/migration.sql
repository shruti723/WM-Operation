/*
  Warnings:

  - A unique constraint covering the columns `[month,srNo,siteName]` on the table `FinanceSheetRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FinanceSheetRecord_month_srNo_key";

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSheetRecord_month_srNo_siteName_key" ON "FinanceSheetRecord"("month", "srNo", "siteName");
