-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_apartmentId_fkey";

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
