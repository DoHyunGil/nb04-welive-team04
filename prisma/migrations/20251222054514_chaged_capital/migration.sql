/*
  Warnings:

  - You are about to drop the column `isregistered` on the `Resident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "isregistered",
ADD COLUMN     "isRegistered" BOOLEAN NOT NULL DEFAULT false;
