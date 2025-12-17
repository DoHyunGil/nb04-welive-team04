/*
  Warnings:

  - Added the required column `buildingNumberFrom` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buildingNumberTo` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorCountPerBuilding` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCountPerFloor` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN     "buildingNumberFrom" INTEGER NOT NULL,
ADD COLUMN     "buildingNumberTo" INTEGER NOT NULL,
ADD COLUMN     "floorCountPerBuilding" INTEGER NOT NULL,
ADD COLUMN     "unitCountPerFloor" INTEGER NOT NULL;
