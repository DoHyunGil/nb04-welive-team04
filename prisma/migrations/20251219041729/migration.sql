/*
  Warnings:

  - You are about to drop the column `buildingNumberFrom` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `buildingNumberTo` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `floorCountPerBuilding` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `unitCountPerFloor` on the `Apartment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "buildingNumberFrom",
DROP COLUMN "buildingNumberTo",
DROP COLUMN "floorCountPerBuilding",
DROP COLUMN "unitCountPerFloor";
