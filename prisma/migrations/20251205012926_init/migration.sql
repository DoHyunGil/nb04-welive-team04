/*
  Warnings:

  - Added the required column `address` to the `adminOf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buildingNumberFrom` to the `adminOf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buildingNumberTo` to the `adminOf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorCountPerBuilding` to the `adminOf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `adminOf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCountPerFloor` to the `adminOf` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "joinStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "adminOf" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "buildingNumberFrom" INTEGER NOT NULL,
ADD COLUMN     "buildingNumberTo" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "floorCountPerBuilding" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "officeNumber" TEXT,
ADD COLUMN     "unitCountPerFloor" INTEGER NOT NULL;
