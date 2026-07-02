-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('draft', 'in_progress', 'ready_for_delivery', 'closed');

-- CreateEnum
CREATE TYPE "TaskItemStatus" AS ENUM ('pending_allocation', 'pending_pickup', 'in_progress', 'submitted', 'returned');

-- CreateEnum
CREATE TYPE "TaskAssignmentStatus" AS ENUM ('assigned', 'accepted', 'completed', 'rejected');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "taskType" TEXT NOT NULL,
    "sopDocument" TEXT,
    "acceptanceCriteria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'draft',
    "plannedTaskCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "externalRef" TEXT,
    "title" TEXT NOT NULL,
    "inputPayload" JSONB NOT NULL,
    "status" "TaskItemStatus" NOT NULL DEFAULT 'pending_allocation',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "taskItemId" TEXT NOT NULL,
    "operatorId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "status" "TaskAssignmentStatus" NOT NULL DEFAULT 'assigned',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Batch_projectId_idx" ON "Batch"("projectId");

-- CreateIndex
CREATE INDEX "TaskItem_batchId_idx" ON "TaskItem"("batchId");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskItemId_idx" ON "TaskAssignment"("taskItemId");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskItemId_fkey" FOREIGN KEY ("taskItemId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
