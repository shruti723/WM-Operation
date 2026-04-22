-- CreateTable
CREATE TABLE "PettyCashRecord" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "month" TEXT,
    "paymentDate" TIMESTAMP(3),
    "individualName" TEXT,
    "fixedAmount" DOUBLE PRECISION,
    "amountPaid" DOUBLE PRECISION,
    "additionalRequestRaised" TEXT,
    "lastDisbursement" TEXT,
    "pettyCashStatement" TEXT,
    "auditStatus" TEXT,
    "auditObservationStatus" TEXT,
    "purpose" TEXT,
    "currentExpenditureStatus" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PettyCashRecord" ADD CONSTRAINT "PettyCashRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
