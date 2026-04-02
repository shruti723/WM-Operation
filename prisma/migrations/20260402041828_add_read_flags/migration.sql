/*
  Warnings:

  - Changed the type of `authorRole` on the `ChecklistComment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ChecklistComment" ADD COLUMN     "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readBySupervisor" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "authorRole",
ADD COLUMN     "authorRole" TEXT NOT NULL;
