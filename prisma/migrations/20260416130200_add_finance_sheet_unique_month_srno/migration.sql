/*
  Warnings:

  - A unique constraint covering the columns `[month,srNo]` on the table `FinanceSheetRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FinanceSheetRecord_month_srNo_key" ON "FinanceSheetRecord"("month", "srNo");
