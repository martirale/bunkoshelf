-- AlterTable
ALTER TABLE "UserToVolume" ADD COLUMN "lastPage" INTEGER;
ALTER TABLE "UserToVolume" ADD COLUMN "lastReadAt" DATETIME;
ALTER TABLE "UserToVolume" ADD COLUMN "totalPages" INTEGER;
