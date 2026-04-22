-- CreateTable
CREATE TABLE "FinanceSheetRecord" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "srNo" INTEGER NOT NULL,
    "siteName" TEXT NOT NULL,
    "billAmount" DOUBLE PRECISION,
    "prepared" TEXT NOT NULL,
    "prepareDate" TEXT,
    "dispatched" TEXT NOT NULL,
    "dispatchDate" TEXT,
    "paymentCheque" TEXT NOT NULL,
    "receivedDate" TEXT,
    "paymentReceivedDays" INTEGER,
    "salaryDisbursementDate" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google-sheet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceSheetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceSheetRecord_month_idx" ON "FinanceSheetRecord"("month");

-- CreateIndex
CREATE INDEX "FinanceSheetRecord_siteName_idx" ON "FinanceSheetRecord"("siteName");
