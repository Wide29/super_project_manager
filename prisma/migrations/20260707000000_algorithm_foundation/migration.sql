-- CreateEnum
CREATE TYPE "AlgorithmRuleConfigStatus" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "AlgorithmModelStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "AlgorithmInvocationStatus" AS ENUM ('succeeded', 'failed', 'fallback');

-- CreateTable
CREATE TABLE "AlgorithmRuleConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "ruleType" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "name" TEXT,
    "configJson" JSONB NOT NULL,
    "status" "AlgorithmRuleConfigStatus" NOT NULL DEFAULT 'draft',
    "effectiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmRuleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmModelRegistry" (
    "id" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "featureVersion" TEXT,
    "trainingDatasetVersion" TEXT,
    "status" "AlgorithmModelStatus" NOT NULL DEFAULT 'draft',
    "metadataJson" JSONB,
    "deployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlgorithmModelRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlgorithmInvocationLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "AlgorithmInvocationStatus" NOT NULL,
    "requestJson" JSONB,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlgorithmInvocationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskMatchingRecommendation" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "modelVersion" TEXT,
    "ruleVersion" TEXT,
    "candidateListJson" JSONB NOT NULL,
    "selectedWorkerId" TEXT,
    "selectedByUserId" TEXT,
    "selectionSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskMatchingRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRiskScore" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reasonCodesJson" JSONB NOT NULL,
    "modelVersion" TEXT,
    "featureVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerRiskScore" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "reasonCodesJson" JSONB NOT NULL,
    "windowType" TEXT NOT NULL,
    "modelVersion" TEXT,
    "featureVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerRiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSamplingPlan" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "recommendedRatio" DOUBLE PRECISION NOT NULL,
    "recommendedCount" INTEGER NOT NULL,
    "highRiskTaskIdsJson" JSONB NOT NULL,
    "samplingStrategy" TEXT NOT NULL,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchSamplingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchForecastResult" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "predictedFinishAt" TIMESTAMP(3),
    "delayProbability" DOUBLE PRECISION NOT NULL,
    "capacityGap" INTEGER NOT NULL,
    "recommendedExtraHeadcount" INTEGER NOT NULL,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchForecastResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlgorithmRuleConfig_projectId_idx" ON "AlgorithmRuleConfig"("projectId");

-- CreateIndex
CREATE INDEX "AlgorithmRuleConfig_ruleType_status_idx" ON "AlgorithmRuleConfig"("ruleType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AlgorithmModelRegistry_modelKey_modelVersion_key" ON "AlgorithmModelRegistry"("modelKey", "modelVersion");

-- CreateIndex
CREATE INDEX "AlgorithmModelRegistry_modelKey_status_idx" ON "AlgorithmModelRegistry"("modelKey", "status");

-- CreateIndex
CREATE INDEX "AlgorithmInvocationLog_requestId_idx" ON "AlgorithmInvocationLog"("requestId");

-- CreateIndex
CREATE INDEX "AlgorithmInvocationLog_entityType_entityId_idx" ON "AlgorithmInvocationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AlgorithmInvocationLog_route_createdAt_idx" ON "AlgorithmInvocationLog"("route", "createdAt");

-- CreateIndex
CREATE INDEX "TaskMatchingRecommendation_taskId_createdAt_idx" ON "TaskMatchingRecommendation"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskMatchingRecommendation_requestId_idx" ON "TaskMatchingRecommendation"("requestId");

-- CreateIndex
CREATE INDEX "TaskMatchingRecommendation_projectId_batchId_idx" ON "TaskMatchingRecommendation"("projectId", "batchId");

-- CreateIndex
CREATE INDEX "TaskRiskScore_taskId_createdAt_idx" ON "TaskRiskScore"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "TaskRiskScore_requestId_idx" ON "TaskRiskScore"("requestId");

-- CreateIndex
CREATE INDEX "WorkerRiskScore_workerId_createdAt_idx" ON "WorkerRiskScore"("workerId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkerRiskScore_requestId_idx" ON "WorkerRiskScore"("requestId");

-- CreateIndex
CREATE INDEX "BatchSamplingPlan_batchId_createdAt_idx" ON "BatchSamplingPlan"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchSamplingPlan_requestId_idx" ON "BatchSamplingPlan"("requestId");

-- CreateIndex
CREATE INDEX "BatchForecastResult_batchId_createdAt_idx" ON "BatchForecastResult"("batchId", "createdAt");

-- CreateIndex
CREATE INDEX "BatchForecastResult_requestId_idx" ON "BatchForecastResult"("requestId");

-- AddForeignKey
ALTER TABLE "AlgorithmRuleConfig" ADD CONSTRAINT "AlgorithmRuleConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMatchingRecommendation" ADD CONSTRAINT "TaskMatchingRecommendation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRiskScore" ADD CONSTRAINT "TaskRiskScore_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSamplingPlan" ADD CONSTRAINT "BatchSamplingPlan_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchForecastResult" ADD CONSTRAINT "BatchForecastResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
