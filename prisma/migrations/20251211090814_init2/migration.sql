/*
  Warnings:

  - A unique constraint covering the columns `[email,apartmentId]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contact,apartmentId]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Resident_email_apartmentId_key" ON "Resident"("email", "apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_contact_apartmentId_key" ON "Resident"("contact", "apartmentId");
