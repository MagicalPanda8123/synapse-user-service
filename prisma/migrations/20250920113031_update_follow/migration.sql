/*
  Warnings:

  - The `status` column on the `Follow` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."FollowStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "public"."Follow" DROP COLUMN "status",
ADD COLUMN     "status" "public"."FollowStatus" NOT NULL DEFAULT 'ACCEPTED';
