import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlgorithmGatewayService } from './algorithm-gateway.service';
import { AlgorithmsService } from './algorithms.service';
import { BatchSamplingPlanDto } from './dto/batch-sampling-plan.dto';
import { CreateAlgorithmRuleConfigDto } from './dto/create-algorithm-rule-config.dto';
import { RecommendTaskWorkersDto } from './dto/recommend-task-workers.dto';
import { TaskRiskScoreDto } from './dto/task-risk-score.dto';
import { UpdateAlgorithmRuleConfigDto } from './dto/update-algorithm-rule-config.dto';
import { WorkerRiskScoreDto } from './dto/worker-risk-score.dto';

@ApiTags('algorithms')
@Controller()
export class AlgorithmsController {
  constructor(
    private readonly algorithmsService: AlgorithmsService,
    private readonly algorithmGatewayService: AlgorithmGatewayService
  ) {}

  @Post('algorithms/rule-configs')
  createRuleConfig(@Body() dto: CreateAlgorithmRuleConfigDto) {
    return this.algorithmsService.createRuleConfig(dto);
  }

  @Get('algorithms/rule-configs')
  listRuleConfigs(
    @Query('projectId') projectId?: string,
    @Query('ruleType') ruleType?: string
  ) {
    return this.algorithmsService.listRuleConfigs({ projectId, ruleType });
  }

  @Patch('algorithms/rule-configs/:id')
  updateRuleConfig(@Param('id') id: string, @Body() dto: UpdateAlgorithmRuleConfigDto) {
    return this.algorithmsService.updateRuleConfig(id, dto);
  }

  @Get('tasks/:taskId/algorithm-snapshots')
  getTaskSnapshots(@Param('taskId') taskId: string) {
    return this.algorithmsService.getTaskSnapshots(taskId);
  }

  @Get('batches/:batchId/algorithm-snapshots')
  getBatchSnapshots(@Param('batchId') batchId: string) {
    return this.algorithmsService.getBatchSnapshots(batchId);
  }

  @Get('workers/:workerId/algorithm-snapshots')
  getWorkerSnapshots(@Param('workerId') workerId: string) {
    return this.algorithmsService.getWorkerSnapshots(workerId);
  }

  @Post('internal/algorithm/matching/recommend-task-workers')
  recommendTaskWorkers(@Body() dto: RecommendTaskWorkersDto) {
    return this.algorithmGatewayService.recommendTaskWorkers(dto);
  }

  @Post('internal/algorithm/risk/task-score')
  scoreTaskRisk(@Body() dto: TaskRiskScoreDto) {
    return this.algorithmGatewayService.scoreTaskRisk(dto);
  }

  @Post('internal/algorithm/risk/worker-score')
  scoreWorkerRisk(@Body() dto: WorkerRiskScoreDto) {
    return this.algorithmGatewayService.scoreWorkerRisk(dto);
  }

  @Post('internal/algorithm/sampling/batch-plan')
  createBatchSamplingPlan(@Body() dto: BatchSamplingPlanDto) {
    return this.algorithmGatewayService.createBatchSamplingPlan(dto);
  }
}
