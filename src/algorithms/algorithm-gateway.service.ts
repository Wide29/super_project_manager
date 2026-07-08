import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendTaskWorkersDto } from './dto/recommend-task-workers.dto';
import { BatchSamplingPlanDto } from './dto/batch-sampling-plan.dto';
import { TaskRiskScoreDto } from './dto/task-risk-score.dto';
import { WorkerRiskScoreDto } from './dto/worker-risk-score.dto';

type RecommendationCandidate = {
  workerId: string;
  rank: number;
  score: number;
  reasons: string[];
  warnings: string[];
};

type GatewayStatus = 'succeeded' | 'failed' | 'fallback';

type MatchingGatewayResponse = {
  requestId: string;
  modelVersion: string;
  ruleVersion: string;
  featureVersion?: string;
  recommendations: RecommendationCandidate[];
};

type TaskRiskGatewayResponse = {
  requestId: string;
  taskId: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  modelVersion: string;
  featureVersion: string;
  ruleVersion?: string;
};

type WorkerRiskGatewayResponse = {
  requestId: string;
  workerId: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  windowType: string;
  modelVersion: string;
  featureVersion: string;
  ruleVersion: string;
};

type SamplingGatewayResponse = {
  requestId: string;
  batchId: string;
  recommendedRatio: number;
  recommendedCount: number;
  highRiskTaskIds: string[];
  samplingStrategy: string;
  modelVersion: string;
  ruleVersion: string;
  featureVersion?: string;
};

@Injectable()
export class AlgorithmGatewayService {
  constructor(private readonly prisma: PrismaService) {}

  async recommendTaskWorkers(dto: RecommendTaskWorkersDto) {
    const startedAt = Date.now();
    const requestId = randomUUID();

    try {
      const task = await this.prisma.taskItem.findUnique({
        where: { id: dto.taskId },
        include: {
          batch: {
            include: {
              project: true
            }
          },
          assignments: {
            orderBy: { assignedAt: 'desc' }
          }
        }
      });

      if (!task) {
        throw new NotFoundException(`Task ${dto.taskId} not found`);
      }

      const activeRule = await this.getActiveRuleConfig('matching', dto.projectId);
      const candidateWorkerIds =
        dto.candidateWorkerIds && dto.candidateWorkerIds.length > 0
          ? dto.candidateWorkerIds
          : await this.getHistoricalCandidates(dto.projectId, dto.batchId);

      let response: MatchingGatewayResponse;
      let status: GatewayStatus = 'succeeded';
      let fallbackErrorMessage: string | undefined;

      try {
        response =
          (await this.tryPythonMatching(dto, candidateWorkerIds)) ??
          (await this.buildLocalMatchingResponse(
            dto,
            requestId,
            activeRule?.ruleVersion ?? 'system-default',
            candidateWorkerIds
          ));
      } catch (error) {
        status = 'fallback';
        fallbackErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        response = await this.buildLocalMatchingResponse(
          dto,
          requestId,
          activeRule?.ruleVersion ?? 'system-default',
          candidateWorkerIds
        );
      }

      await this.prisma.taskMatchingRecommendation.create({
        data: {
          taskId: task.id,
          projectId: task.batch.projectId,
          batchId: task.batchId,
          requestId: response.requestId,
          modelVersion: response.modelVersion,
          ruleVersion: response.ruleVersion,
          candidateListJson: response.recommendations as Prisma.InputJsonValue
        }
      });

      await this.logInvocation({
        requestId: response.requestId,
        route: 'matching/recommend-task-workers',
        entityType: 'task',
        entityId: task.id,
        requestJson: dto,
        responseJson: response,
        status,
        errorMessage: fallbackErrorMessage,
        latencyMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      await this.logInvocation({
        requestId,
        route: 'matching/recommend-task-workers',
        entityType: 'task',
        entityId: dto.taskId,
        requestJson: dto,
        responseJson: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startedAt
      });

      throw error;
    }
  }

  async scoreTaskRisk(dto: TaskRiskScoreDto) {
    const startedAt = Date.now();
    const requestId = randomUUID();

    try {
      const task = await this.prisma.taskItem.findUnique({
        where: { id: dto.taskId },
        include: {
          batch: true,
          assignments: true,
          reviews: true
        }
      });

      if (!task) {
        throw new NotFoundException(`Task ${dto.taskId} not found`);
      }

      const activeRule = await this.getActiveRuleConfig('task_risk', task.batch.projectId);
      let response: TaskRiskGatewayResponse;
      let status: GatewayStatus = 'succeeded';
      let fallbackErrorMessage: string | undefined;

      try {
        response =
          (await this.tryPythonTaskRisk(task)) ??
          this.buildLocalTaskRiskResponse(
            task,
            requestId,
            activeRule?.ruleVersion ?? 'system-default'
          );
      } catch (error) {
        status = 'fallback';
        fallbackErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        response = this.buildLocalTaskRiskResponse(
          task,
          requestId,
          activeRule?.ruleVersion ?? 'system-default'
        );
      }

      await this.prisma.taskRiskScore.create({
        data: {
          taskId: task.id,
          requestId: response.requestId,
          riskScore: response.riskScore,
          riskLevel: response.riskLevel,
          reasonCodesJson: response.reasons as Prisma.InputJsonValue,
          modelVersion: response.modelVersion,
          featureVersion: response.featureVersion
        }
      });

      await this.logInvocation({
        requestId: response.requestId,
        route: 'risk/task-score',
        entityType: 'task',
        entityId: task.id,
        requestJson: dto,
        responseJson: response,
        status,
        errorMessage: fallbackErrorMessage,
        latencyMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      await this.logInvocation({
        requestId,
        route: 'risk/task-score',
        entityType: 'task',
        entityId: dto.taskId,
        requestJson: dto,
        responseJson: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startedAt
      });

      throw error;
    }
  }

  async scoreWorkerRisk(dto: WorkerRiskScoreDto) {
    const startedAt = Date.now();
    const requestId = randomUUID();

    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: {
          assigneeId: dto.workerId
        },
        orderBy: {
          assignedAt: 'desc'
        },
        take: 20,
        include: {
          taskItem: {
            include: {
              reviews: {
                orderBy: { createdAt: 'desc' }
              },
              batch: true
            }
          }
        }
      });

      const activeRule = await this.getActiveRuleConfig('worker_risk', dto.projectId);
      let response: WorkerRiskGatewayResponse;
      let status: GatewayStatus = 'succeeded';
      let fallbackErrorMessage: string | undefined;

      try {
        response =
          (await this.tryPythonWorkerRisk(dto, assignments)) ??
          this.buildLocalWorkerRiskResponse(
            dto,
            assignments,
            requestId,
            activeRule?.ruleVersion ?? 'system-default'
          );
      } catch (error) {
        status = 'fallback';
        fallbackErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        response = this.buildLocalWorkerRiskResponse(
          dto,
          assignments,
          requestId,
          activeRule?.ruleVersion ?? 'system-default'
        );
      }

      await this.prisma.workerRiskScore.create({
        data: {
          workerId: dto.workerId,
          requestId: response.requestId,
          riskScore: response.riskScore,
          riskLevel: response.riskLevel,
          reasonCodesJson: response.reasons as Prisma.InputJsonValue,
          windowType: response.windowType,
          modelVersion: response.modelVersion,
          featureVersion: response.featureVersion
        }
      });

      await this.logInvocation({
        requestId: response.requestId,
        route: 'risk/worker-score',
        entityType: 'worker',
        entityId: dto.workerId,
        requestJson: dto,
        responseJson: response,
        status,
        errorMessage: fallbackErrorMessage,
        latencyMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      await this.logInvocation({
        requestId,
        route: 'risk/worker-score',
        entityType: 'worker',
        entityId: dto.workerId,
        requestJson: dto,
        responseJson: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startedAt
      });

      throw error;
    }
  }

  async createBatchSamplingPlan(dto: BatchSamplingPlanDto) {
    const startedAt = Date.now();
    const requestId = randomUUID();

    try {
      const batch = await this.prisma.batch.findUnique({
        where: { id: dto.batchId },
        include: {
          tasks: {
            include: {
              assignments: true,
              reviews: {
                orderBy: { createdAt: 'desc' }
              },
              riskScores: {
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (!batch) {
        throw new NotFoundException(`Batch ${dto.batchId} not found`);
      }

      const activeRule = await this.getActiveRuleConfig('sampling', dto.projectId ?? batch.projectId);
      const taskRiskItems = batch.tasks.map((task) => {
        const latestRiskScore = task.riskScores[0];

        if (latestRiskScore) {
          return {
            taskId: task.id,
            riskScore: latestRiskScore.riskScore
          };
        }

        const fallbackRisk = this.calculateTaskRisk({
          priority: task.priority,
          status: task.status,
          assignments: task.assignments ?? [],
          reviews: task.reviews
        });

        return {
          taskId: task.id,
          riskScore: fallbackRisk.score
        };
      });

      let response: SamplingGatewayResponse;
      let status: GatewayStatus = 'succeeded';
      let fallbackErrorMessage: string | undefined;

      try {
        response =
          (await this.tryPythonSampling(batch.id, batch.projectId, taskRiskItems)) ??
          this.buildLocalSamplingResponse(
            batch.id,
            requestId,
            taskRiskItems,
            activeRule?.ruleVersion ?? 'system-default'
          );
      } catch (error) {
        status = 'fallback';
        fallbackErrorMessage = error instanceof Error ? error.message : 'Unknown error';
        response = this.buildLocalSamplingResponse(
          batch.id,
          requestId,
          taskRiskItems,
          activeRule?.ruleVersion ?? 'system-default'
        );
      }

      await this.prisma.batchSamplingPlan.create({
        data: {
          batchId: batch.id,
          requestId: response.requestId,
          recommendedRatio: response.recommendedRatio,
          recommendedCount: response.recommendedCount,
          highRiskTaskIdsJson: response.highRiskTaskIds as Prisma.InputJsonValue,
          samplingStrategy: response.samplingStrategy,
          modelVersion: response.modelVersion
        }
      });

      await this.logInvocation({
        requestId: response.requestId,
        route: 'sampling/batch-plan',
        entityType: 'batch',
        entityId: batch.id,
        requestJson: dto,
        responseJson: response,
        status,
        errorMessage: fallbackErrorMessage,
        latencyMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      await this.logInvocation({
        requestId,
        route: 'sampling/batch-plan',
        entityType: 'batch',
        entityId: dto.batchId,
        requestJson: dto,
        responseJson: null,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startedAt
      });

      throw error;
    }
  }

  private async tryPythonMatching(
    dto: RecommendTaskWorkersDto,
    candidateWorkerIds: string[]
  ): Promise<MatchingGatewayResponse | null> {
    const envelope = await this.callPythonService<{
      request_id: string;
      service_version: string;
      rule_version: string;
      feature_version: string;
      result: {
        recommendations: Array<{
          worker_id: string;
          rank: number;
          score: number;
          reasons: string[];
          warnings: string[];
        }>;
      };
    }>('/api/v1/matching/recommend-task-workers', {
      task_id: dto.taskId,
      project_id: dto.projectId,
      batch_id: dto.batchId,
      candidate_worker_ids: candidateWorkerIds,
      top_k: dto.topK ?? 5,
      context: {
        is_rework: Boolean(dto.context?.isRework),
        original_worker_id: this.getStringContextValue(dto.context, 'originalWorkerId')
      }
    });

    if (!envelope) {
      return null;
    }

    return {
      requestId: envelope.request_id,
      modelVersion: this.toPythonModelVersion(envelope.service_version),
      ruleVersion: envelope.rule_version,
      featureVersion: envelope.feature_version,
      recommendations: envelope.result.recommendations.map((candidate) => ({
        workerId: candidate.worker_id,
        rank: candidate.rank,
        score: candidate.score,
        reasons: candidate.reasons,
        warnings: candidate.warnings
      }))
    };
  }

  private async tryPythonTaskRisk(task: {
    id: string;
    priority: number;
    status: string;
    assignments: Array<{ id: string }>;
    reviews: Array<{ decision: string; stage: string }>;
    batch: { projectId: string };
  }): Promise<TaskRiskGatewayResponse | null> {
    const rejectedReviews = task.reviews.filter((review) => review.decision === 'rejected').length;
    const historicalDefectRate =
      task.reviews.length > 0 ? rejectedReviews / task.reviews.length : 0;
    const envelope = await this.callPythonService<{
      request_id: string;
      service_version: string;
      rule_version: string;
      feature_version: string;
      result: {
        risk_score: number;
        risk_level: string;
        reason_codes: string[];
      };
    }>('/api/v1/risk/task-score', {
      task_id: task.id,
      project_id: task.batch.projectId,
      context: {
        rework_count: Math.max(task.assignments.length - 1, 0),
        deadline_hours_left: task.priority >= 7 ? 4 : 24,
        historical_defect_rate: historicalDefectRate
      }
    });

    if (!envelope) {
      return null;
    }

    return {
      requestId: envelope.request_id,
      taskId: task.id,
      riskScore: envelope.result.risk_score,
      riskLevel: envelope.result.risk_level,
      reasons: envelope.result.reason_codes,
      modelVersion: this.toPythonModelVersion(envelope.service_version),
      featureVersion: envelope.feature_version,
      ruleVersion: envelope.rule_version
    };
  }

  private async tryPythonWorkerRisk(
    dto: WorkerRiskScoreDto,
    assignments: Array<{
      status: string;
      taskItem: {
        reviews: Array<{ decision: string; stage: string }>;
      };
    }>
  ): Promise<WorkerRiskGatewayResponse | null> {
    const openAssignmentCount = assignments.filter((assignment) =>
      ['assigned', 'accepted', 'in_progress'].includes(assignment.status)
    ).length;
    const rejectedRatio =
      assignments.length === 0
        ? 0
        : assignments.filter((assignment) =>
            assignment.taskItem.reviews.some((review) => review.decision === 'rejected')
          ).length / assignments.length;
    const envelope = await this.callPythonService<{
      request_id: string;
      service_version: string;
      rule_version: string;
      feature_version: string;
      result: {
        risk_score: number;
        risk_level: string;
        reason_codes: string[];
        window_type: string;
      };
    }>('/api/v1/risk/worker-score', {
      worker_id: dto.workerId,
      project_id: dto.projectId,
      window_type: dto.windowType ?? '7d',
      context: {
        recent_pass_rate: assignments.length === 0 ? 1 : 1 - rejectedRatio,
        recent_rework_rate: rejectedRatio,
        active_load: openAssignmentCount
      }
    });

    if (!envelope) {
      return null;
    }

    return {
      requestId: envelope.request_id,
      workerId: dto.workerId,
      riskScore: envelope.result.risk_score,
      riskLevel: envelope.result.risk_level,
      reasons: envelope.result.reason_codes,
      windowType: envelope.result.window_type,
      modelVersion: this.toPythonModelVersion(envelope.service_version),
      featureVersion: envelope.feature_version,
      ruleVersion: envelope.rule_version
    };
  }

  private async tryPythonSampling(
    batchId: string,
    projectId: string,
    taskRiskItems: Array<{ taskId: string; riskScore: number }>
  ): Promise<SamplingGatewayResponse | null> {
    const avgRisk =
      taskRiskItems.length === 0
        ? 0
        : taskRiskItems.reduce((sum, item) => sum + item.riskScore, 0) / taskRiskItems.length;
    const batchRiskLevel = avgRisk >= 0.7 ? 'high' : avgRisk >= 0.4 ? 'medium' : 'low';
    const envelope = await this.callPythonService<{
      request_id: string;
      service_version: string;
      rule_version: string;
      feature_version: string;
      result: {
        sampling_ratio: number;
        sample_count: number;
        selected_task_ids: string[];
        recommendation_flags: string[];
      };
    }>('/api/v1/sampling/batch-plan', {
      batch_id: batchId,
      project_id: projectId,
      task_pool: taskRiskItems.map((item) => ({
        task_id: item.taskId,
        risk_level: this.toRiskLevel(item.riskScore)
      })),
      context: {
        batch_risk_level: batchRiskLevel,
        task_count: taskRiskItems.length
      }
    });

    if (!envelope) {
      return null;
    }

    return {
      requestId: envelope.request_id,
      batchId,
      recommendedRatio: envelope.result.sampling_ratio,
      recommendedCount: envelope.result.sample_count,
      highRiskTaskIds: envelope.result.selected_task_ids,
      samplingStrategy:
        envelope.result.recommendation_flags.join(',') || 'python_algorithm_service',
      modelVersion: this.toPythonModelVersion(envelope.service_version),
      ruleVersion: envelope.rule_version,
      featureVersion: envelope.feature_version
    };
  }

  private async buildLocalMatchingResponse(
    dto: RecommendTaskWorkersDto,
    requestId: string,
    ruleVersion: string,
    candidateWorkerIds: string[]
  ): Promise<MatchingGatewayResponse> {
    const originalWorkerId = this.getStringContextValue(dto.context, 'originalWorkerId');
    const isRework = Boolean(dto.context?.isRework);
    const activeLoads = await this.getActiveLoadMap(candidateWorkerIds);
    const candidates = candidateWorkerIds
      .map((workerId) => {
        const load = activeLoads.get(workerId) ?? 0;
        const score = this.calculateRecommendationScore({
          workerId,
          load,
          isRework,
          originalWorkerId
        });

        return {
          workerId,
          score,
          reasons: [
            load === 0 ? '当前无在途任务' : `当前在途任务数 ${load}`,
            isRework && workerId === originalWorkerId ? '命中原人返修加权' : '进入基础候选池'
          ],
          warnings: load >= 3 ? ['当前负载偏高'] : []
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, dto.topK ?? 5)
      .map<RecommendationCandidate>((candidate, index) => ({
        workerId: candidate.workerId,
        rank: index + 1,
        score: candidate.score,
        reasons: candidate.reasons,
        warnings: candidate.warnings
      }));

    return {
      requestId,
      modelVersion: 'matching_rules_v1',
      ruleVersion,
      recommendations: candidates
    };
  }

  private buildLocalTaskRiskResponse(
    task: {
      id: string;
      priority: number;
      status: string;
      assignments: Array<{ id: string }>;
      reviews: Array<{ decision: string; stage: string }>;
    },
    requestId: string,
    ruleVersion: string
  ): TaskRiskGatewayResponse {
    const risk = this.calculateTaskRisk(task);
    return {
      requestId,
      taskId: task.id,
      riskScore: risk.score,
      riskLevel: risk.level,
      reasons: risk.reasons,
      modelVersion: 'task_risk_rules_v1',
      featureVersion: 'task_feature_v1',
      ruleVersion
    };
  }

  private buildLocalWorkerRiskResponse(
    dto: WorkerRiskScoreDto,
    assignments: Array<{
      status: string;
      taskItem: {
        reviews: Array<{ decision: string; stage: string }>;
      };
    }>,
    requestId: string,
    ruleVersion: string
  ): WorkerRiskGatewayResponse {
    const risk = this.calculateWorkerRisk(assignments);
    return {
      requestId,
      workerId: dto.workerId,
      riskScore: risk.score,
      riskLevel: risk.level,
      reasons: risk.reasons,
      windowType: dto.windowType ?? '7d',
      modelVersion: 'worker_risk_rules_v1',
      featureVersion: 'worker_feature_v1',
      ruleVersion
    };
  }

  private buildLocalSamplingResponse(
    batchId: string,
    requestId: string,
    taskRiskItems: Array<{ taskId: string; riskScore: number }>,
    ruleVersion: string
  ): SamplingGatewayResponse {
    const plan = this.calculateBatchSamplingPlan(taskRiskItems);
    return {
      requestId,
      batchId,
      recommendedRatio: plan.ratio,
      recommendedCount: plan.count,
      highRiskTaskIds: plan.highRiskTaskIds,
      samplingStrategy: plan.strategy,
      modelVersion: 'sampling_rules_v1',
      ruleVersion
    };
  }

  private async callPythonService<T>(path: string, payload: unknown): Promise<T | null> {
    const baseUrl = process.env.PYTHON_ALGORITHM_SERVICE_URL?.trim();
    if (!baseUrl) {
      return null;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Python algorithm service request failed: ${response.status} ${body}`);
    }

    return (await response.json()) as T;
  }

  private toPythonModelVersion(serviceVersion: string) {
    return `python-service-${serviceVersion}`;
  }

  private toRiskLevel(score: number) {
    if (score >= 0.7) {
      return 'high';
    }
    if (score >= 0.4) {
      return 'medium';
    }
    return 'low';
  }

  private calculateRecommendationScore(params: {
    workerId: string;
    load: number;
    isRework: boolean;
    originalWorkerId?: string;
  }) {
    let score = 0.7 - params.load * 0.08;

    if (params.isRework && params.workerId === params.originalWorkerId) {
      score += 0.18;
    }

    return Number(Math.max(0.05, Math.min(0.99, score)).toFixed(2));
  }

  private calculateTaskRisk(task: {
    priority: number;
    status: string;
    assignments: Array<{ id: string }>;
    reviews: Array<{ decision: string; stage: string }>;
  }) {
    const reasons: string[] = [];
    let score = 0.18;

    if (task.priority >= 7) {
      score += 0.22;
      reasons.push('high_priority');
    }

    if (task.assignments.length > 1) {
      score += 0.16;
      reasons.push('multi_assignment_history');
    }

    const rejectedReviews = task.reviews.filter((review) => review.decision === 'rejected').length;
    if (rejectedReviews > 0) {
      score += Math.min(0.3, rejectedReviews * 0.12);
      reasons.push('historical_rejection');
    }

    if (task.status === 'qa_rejected') {
      score += 0.2;
      reasons.push('qa_rejected_status');
    }

    const normalizedScore = Number(Math.max(0.05, Math.min(0.99, score)).toFixed(2));
    const level =
      normalizedScore >= 0.7 ? 'high' : normalizedScore >= 0.4 ? 'medium' : 'low';

    if (reasons.length === 0) {
      reasons.push('baseline_monitoring');
    }

    return { score: normalizedScore, level, reasons };
  }

  private calculateWorkerRisk(
    assignments: Array<{
      status: string;
      taskItem: {
        reviews: Array<{ decision: string; stage: string }>;
      };
    }>
  ) {
    if (assignments.length === 0) {
      return {
        score: 0.12,
        level: 'low',
        reasons: ['insufficient_history']
      };
    }

    const completedAssignments = assignments.filter(
      (assignment) => assignment.status === 'completed'
    ).length;
    const rejectedReviews = assignments.reduce((count, assignment) => {
      const hasRejectedReview = assignment.taskItem.reviews.some(
        (review) => review.decision === 'rejected'
      );

      return count + (hasRejectedReview ? 1 : 0);
    }, 0);

    const completedRatio = completedAssignments / assignments.length;
    const rejectedRatio = rejectedReviews / assignments.length;

    let score = 0.16;
    const reasons: string[] = [];

    if (completedRatio < 0.6) {
      score += 0.2;
      reasons.push('low_completion_ratio');
    }

    if (rejectedRatio >= 0.3) {
      score += 0.32;
      reasons.push('high_rejection_ratio');
    } else if (rejectedRatio > 0) {
      score += 0.16;
      reasons.push('recent_rejection_detected');
    }

    if (assignments.length >= 5) {
      reasons.push('sufficient_recent_activity');
    }

    const normalizedScore = Number(Math.max(0.05, Math.min(0.99, score)).toFixed(2));
    const level =
      normalizedScore >= 0.7 ? 'high_risk' : normalizedScore >= 0.4 ? 'watch' : 'stable';

    if (reasons.length === 0) {
      reasons.push('stable_recent_window');
    }

    return { score: normalizedScore, level, reasons };
  }

  private calculateBatchSamplingPlan(taskRiskItems: Array<{ taskId: string; riskScore: number }>) {
    const taskCount = taskRiskItems.length;

    if (taskCount === 0) {
      return {
        ratio: 0,
        count: 0,
        highRiskTaskIds: [],
        strategy: 'empty_batch'
      };
    }

    const highRiskTaskIds = taskRiskItems
      .filter((item) => item.riskScore >= 0.7)
      .map((item) => item.taskId);

    const avgRisk =
      taskRiskItems.reduce((sum, item) => sum + item.riskScore, 0) / taskRiskItems.length;
    const baseRatio = 0.1;
    const ratioBonus = avgRisk >= 0.7 ? 0.3 : avgRisk >= 0.45 ? 0.15 : 0.05;
    const ratio = Number(Math.min(0.8, baseRatio + ratioBonus).toFixed(2));
    const baselineCount = Math.max(1, Math.ceil(taskCount * ratio));
    const count = Math.min(taskCount, Math.max(baselineCount, highRiskTaskIds.length));
    const strategy =
      highRiskTaskIds.length > 0 ? 'risk_weighted_with_high_risk_mandatory' : 'baseline_dynamic_ratio';

    return {
      ratio,
      count,
      highRiskTaskIds,
      strategy
    };
  }

  private async getActiveRuleConfig(ruleType: string, projectId?: string) {
    return this.prisma.algorithmRuleConfig.findFirst({
      where: {
        ruleType,
        status: 'active',
        ...(projectId
          ? {
              OR: [{ projectId }, { projectId: null }]
            }
          : {
              projectId: null
            })
      },
      orderBy: [{ updatedAt: 'desc' }]
    });
  }

  private async getHistoricalCandidates(projectId: string, batchId: string) {
    const projectAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskItem: {
          batch: {
            projectId
          }
        }
      },
      distinct: ['assigneeId'],
      select: {
        assigneeId: true
      },
      take: 10
    });

    if (projectAssignments.length > 0) {
      return projectAssignments.map((assignment) => assignment.assigneeId);
    }

    const batchAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        taskItem: {
          batchId
        }
      },
      distinct: ['assigneeId'],
      select: {
        assigneeId: true
      },
      take: 10
    });

    return batchAssignments.map((assignment) => assignment.assigneeId);
  }

  private async getActiveLoadMap(workerIds: string[]) {
    if (workerIds.length === 0) {
      return new Map<string, number>();
    }

    const assignments = await this.prisma.taskAssignment.findMany({
      where: {
        assigneeId: {
          in: workerIds
        },
        status: {
          in: ['assigned', 'accepted', 'in_progress']
        }
      },
      select: {
        assigneeId: true
      }
    });

    return assignments.reduce((map, assignment) => {
      map.set(assignment.assigneeId, (map.get(assignment.assigneeId) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  private getStringContextValue(context: Record<string, unknown> | undefined, key: string) {
    const value = context?.[key];
    return typeof value === 'string' ? value : undefined;
  }

  private async logInvocation(params: {
    requestId: string;
    route: string;
    entityType: string;
    entityId: string;
    status: 'succeeded' | 'failed' | 'fallback';
    requestJson: unknown;
    responseJson: unknown;
    errorMessage?: string;
    latencyMs: number;
  }) {
    await this.prisma.algorithmInvocationLog.create({
      data: {
        requestId: params.requestId,
        route: params.route,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status,
        requestJson:
          params.requestJson === null || params.requestJson === undefined
            ? undefined
            : (params.requestJson as Prisma.InputJsonValue),
        responseJson:
          params.responseJson === null || params.responseJson === undefined
            ? undefined
            : (params.responseJson as Prisma.InputJsonValue),
        errorMessage: params.errorMessage,
        latencyMs: params.latencyMs,
        fallbackUsed: params.status === 'fallback'
      }
    });
  }
}
