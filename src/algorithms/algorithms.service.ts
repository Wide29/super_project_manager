import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlgorithmRuleConfigDto } from './dto/create-algorithm-rule-config.dto';
import { UpdateAlgorithmRuleConfigDto } from './dto/update-algorithm-rule-config.dto';

@Injectable()
export class AlgorithmsService {
  constructor(private readonly prisma: PrismaService) {}

  createRuleConfig(dto: CreateAlgorithmRuleConfigDto) {
    return this.prisma.algorithmRuleConfig.create({
      data: {
        projectId: dto.projectId,
        ruleType: dto.ruleType,
        ruleVersion: dto.ruleVersion,
        name: dto.name,
        configJson: dto.config as Prisma.InputJsonValue,
        status: dto.status,
        effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : undefined
      }
    });
  }

  listRuleConfigs(filters: { projectId?: string; ruleType?: string }) {
    return this.prisma.algorithmRuleConfig.findMany({
      where: {
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.ruleType ? { ruleType: filters.ruleType } : {})
      },
      orderBy: [{ updatedAt: 'desc' }]
    });
  }

  async updateRuleConfig(id: string, dto: UpdateAlgorithmRuleConfigDto) {
    await this.findRuleConfig(id);

    return this.prisma.algorithmRuleConfig.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.config !== undefined
          ? { configJson: dto.config as Prisma.InputJsonValue }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.effectiveAt !== undefined
          ? { effectiveAt: dto.effectiveAt ? new Date(dto.effectiveAt) : null }
          : {})
      }
    });
  }

  async findRuleConfig(id: string) {
    const config = await this.prisma.algorithmRuleConfig.findUnique({ where: { id } });

    if (!config) {
      throw new NotFoundException(`Algorithm rule config ${id} not found`);
    }

    return config;
  }

  async getTaskSnapshots(taskId: string) {
    const task = await this.prisma.taskItem.findUnique({
      where: { id: taskId },
      include: {
        batch: true
      }
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    const [recommendations, riskScores, invocationLogs] = await Promise.all([
      this.prisma.taskMatchingRecommendation.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.taskRiskScore.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.algorithmInvocationLog.findMany({
        where: {
          entityType: 'task',
          entityId: taskId
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    return {
      taskId,
      batchId: task.batchId,
      projectId: task.batch.projectId,
      recommendations,
      riskScores,
      invocationLogs
    };
  }

  async getBatchSnapshots(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });

    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} not found`);
    }

    const [samplingPlans, forecastResults, invocationLogs] = await Promise.all([
      this.prisma.batchSamplingPlan.findMany({
        where: { batchId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.batchForecastResult.findMany({
        where: { batchId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      this.prisma.algorithmInvocationLog.findMany({
        where: {
          entityType: 'batch',
          entityId: batchId
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    return {
      batchId,
      projectId: batch.projectId,
      samplingPlans,
      forecastResults,
      invocationLogs
    };
  }

  async getWorkerSnapshots(workerId: string) {
    const [riskScores, invocationLogs] = await Promise.all([
      this.prisma.workerRiskScore.findMany({
        where: { workerId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      this.prisma.algorithmInvocationLog.findMany({
        where: {
          entityType: 'worker',
          entityId: workerId
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    return {
      workerId,
      riskScores,
      invocationLogs
    };
  }

  async recordRecommendationSelection(params: {
    taskId: string;
    requestId?: string;
    selectedWorkerId: string;
    selectedByUserId?: string;
    selectionSource?: string;
  }) {
    if (!params.requestId) {
      return null;
    }

    const recommendation = await this.prisma.taskMatchingRecommendation.findFirst({
      where: {
        taskId: params.taskId,
        requestId: params.requestId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!recommendation) {
      return null;
    }

    return this.prisma.taskMatchingRecommendation.update({
      where: { id: recommendation.id },
      data: {
        selectedWorkerId: params.selectedWorkerId,
        selectedByUserId: params.selectedByUserId,
        selectionSource: params.selectionSource ?? 'manual'
      }
    });
  }
}
