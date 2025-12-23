/*
  Warnings:

  - Added the required column `resourceType` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommentResourceType" AS ENUM ('NOTICE', 'COMPLAINT');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_complainId_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "noticeId" INTEGER,
ADD COLUMN     "resourceType" "CommentResourceType" NOT NULL,
ALTER COLUMN "complainId" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Comment_complainId_idx" ON "Comment"("complainId");

-- CreateIndex
CREATE INDEX "Comment_noticeId_idx" ON "Comment"("noticeId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_complainId_fkey" FOREIGN KEY ("complainId") REFERENCES "Complain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
