/*
  Warnings:

  - The `source` column on the `ChecklistAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `authorRole` on the `ChecklistComment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ChecklistAnswer" DROP COLUMN "source",
ADD COLUMN     "source" "ChecklistSource";

-- AlterTable
ALTER TABLE "ChecklistComment" DROP COLUMN "authorRole",
ADD COLUMN     "authorRole" "UserRole" NOT NULL;
