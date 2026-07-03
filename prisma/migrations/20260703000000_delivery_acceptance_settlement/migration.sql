-- CreateEnum
CREATE TYPE "TaskReviewStage" AS ENUM ('qa', 'algorithm_sampling');

-- CreateEnum
CREATE TYPE "TaskReviewDecision" AS ENUM ('passed', 'rejected');

-- CreateEnum
CREATE TYPE "BatchDeliveryStatus" AS ENUM ('submitted', 'superseded');

-- CreateEnum
CREATE TYPE "BatchAcceptanceDecision" AS ENUM ('accepted', 'partially_rejected', 'rejected');

-- CreateEnum
CREATE TYPE "TaskSettlementDecisionMode" AS ENUM ('single_owner', 'split');

-- CreateEnum
CREATE TYPE "TaskTransferReason" AS ENUM ('offboarded', 'leave', 'capacity_rebalance', 'rework', 'manual');

-- AlterEnum
ALTER TYPE "BatchStatus" ADD VALUE 'delivered';
ALTER TYPE "BatchStatus" ADD VALUE 'partially_rejected';
ALTER TYPE "BatchStatus" ADD VALUE 'accepted';
ALTER TYPE "BatchStatus" ADD VALUE 'rejected';

-- AlterEnum
ALTER TYPE "TaskAssignmentStatus" ADD VALUE 'in_progress';
ALTER TYPE "TaskAssignmentStatus" ADD VALUE 'transferred';

-- AlterEnum
BEGIN;
CREATE TYPE "TaskItemStatus_new" AS ENUM (
  'pending_allocation',
  'pending_pickup',
  'in_progress',
  'submitted',
  'qa_rejected',
  'qa_passed',
  'delivered',
  'sampling_rejected',
  'sampling_passed'
);
ALTER TABLE "public"."TaskItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TaskItem" ALTER COLUMN "status" TYPE "TaskItemStatus_new" USING (
  CASE
    WHEN "status"::text = 'returned' THEN 'qa_rejected'
    ELSE "status"::text
  END::"TaskItemStatus_new"
);
ALTER TYPE "TaskItemStatus" RENAME TO "TaskItemStatus_old";
ALTER TYPE "TaskItemStatus_new" RENAME TO "TaskItemStatus";
DROP TYPE "public"."TaskItemStatus_old";
ALTER TABLE "TaskItem" ALTER COLUMN "status" SET DEFAULT 'pending_allocation';
COMMIT;

-- AlterTable
ALTER TABLE "TaskAssignment"
ADD COLUMN "sourceAssignmentId" TEXT,
ADD COLUMN "transferReason" "TaskTransferReason";

-- CreateTable
CREATE TABLE "TaskReview" (
  "id" TEXT NOT NULL,
  "taskItemId" TEXT NOT NULL,
  "stage" "TaskReviewStage" NOT NULL,
  "decision" "TaskReviewDecision" NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "notes" TEXT,
  "batchAcceptanceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchDelivery" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "submittedBy" TEXT NOT NULL,
  "notes" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "BatchDeliveryStatus" NOT NULL DEFAULT 'submitted',

  CONSTRAINT "BatchDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchAcceptance" (
  "id" TEXT NOT NULL,
  "deliveryId" TEXT NOT NULL,
  "reviewedBy" TEXT NOT NULL,
  "decision" "BatchAcceptanceDecision" NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "notes" TEXT,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BatchAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSettlement" (
  "id" TEXT NOT NULL,
  "taskItemId" TEXT NOT NULL,
  "decisionMode" "TaskSettlementDecisionMode" NOT NULL,
  "ownerAssignmentId" TEXT,
  "decidedBy" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskSettlementShare" (
  "id" TEXT NOT NULL,
  "settlementId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "percentage" INTEGER NOT NULL,

  CONSTRAINT "TaskSettlementShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskReview_taskItemId_idx" ON "TaskReview"("taskItemId");

-- CreateIndex
CREATE INDEX "TaskReview_batchAcceptanceId_idx" ON "TaskReview"("batchAcceptanceId");

-- CreateIndex
CREATE INDEX "BatchDelivery_batchId_idx" ON "BatchDelivery"("batchId");

-- CreateIndex
CREATE INDEX "BatchAcceptance_deliveryId_idx" ON "BatchAcceptance"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskSettlement_taskItemId_key" ON "TaskSettlement"("taskItemId");

-- CreateIndex
CREATE INDEX "TaskSettlement_ownerAssignmentId_idx" ON "TaskSettlement"("ownerAssignmentId");

-- CreateIndex
CREATE INDEX "TaskSettlementShare_settlementId_idx" ON "TaskSettlementShare"("settlementId");

-- CreateIndex
CREATE INDEX "TaskSettlementShare_assignmentId_idx" ON "TaskSettlementShare"("assignmentId");

-- CreateIndex
CREATE INDEX "TaskAssignment_sourceAssignmentId_idx" ON "TaskAssignment"("sourceAssignmentId");

-- AddForeignKey
ALTER TABLE "TaskAssignment"
ADD CONSTRAINT "TaskAssignment_sourceAssignmentId_fkey"
FOREIGN KEY ("sourceAssignmentId") REFERENCES "TaskAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReview"
ADD CONSTRAINT "TaskReview_taskItemId_fkey"
FOREIGN KEY ("taskItemId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReview"
ADD CONSTRAINT "TaskReview_batchAcceptanceId_fkey"
FOREIGN KEY ("batchAcceptanceId") REFERENCES "BatchAcceptance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchDelivery"
ADD CONSTRAINT "BatchDelivery_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchAcceptance"
ADD CONSTRAINT "BatchAcceptance_deliveryId_fkey"
FOREIGN KEY ("deliveryId") REFERENCES "BatchDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSettlement"
ADD CONSTRAINT "TaskSettlement_taskItemId_fkey"
FOREIGN KEY ("taskItemId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSettlementShare"
ADD CONSTRAINT "TaskSettlementShare_settlementId_fkey"
FOREIGN KEY ("settlementId") REFERENCES "TaskSettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskSettlementShare"
ADD CONSTRAINT "TaskSettlementShare_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "TaskAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
