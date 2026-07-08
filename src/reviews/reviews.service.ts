import { Injectable } from '@nestjs/common';
import { AlgorithmGatewayService } from '../algorithms/algorithm-gateway.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskReviewDto } from './dto/create-task-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly algorithmGatewayService: AlgorithmGatewayService
  ) {}

  async create(taskId: string, dto: CreateTaskReviewDto) {
    await this.tasksService.findOne(taskId);

    const review = await this.prisma.taskReview.create({
      data: {
        taskItemId: taskId,
        stage: dto.stage,
        decision: dto.decision,
        reviewerId: dto.reviewerId,
        notes: dto.notes
      }
    });

    await this.prisma.taskItem.update({
      where: { id: taskId },
      data: {
        status: dto.decision === 'passed' ? 'qa_passed' : 'qa_rejected'
      }
    });

    const latestAssignment = await this.prisma.taskAssignment.findFirst({
      where: { taskItemId: taskId },
      orderBy: { assignedAt: 'desc' },
      select: { assigneeId: true }
    });

    if (latestAssignment) {
      await this.algorithmGatewayService.scoreWorkerRisk({
        workerId: latestAssignment.assigneeId
      });
    }

    return review;
  }

  async findByTask(taskId: string) {
    await this.tasksService.findOne(taskId);

    return this.prisma.taskReview.findMany({
      where: { taskItemId: taskId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
