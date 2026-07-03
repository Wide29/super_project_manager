import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskReviewDto } from './dto/create-task-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService
  ) {}

  async create(taskId: string, dto: CreateTaskReviewDto) {
    await this.tasksService.findOne(taskId);

    const review = await this.prisma.taskReview.create({
      data: {
        taskItemId: taskId,
        stage: dto.stage,
        decision: dto.decision,
        reviewerId: dto.reviewerId,
        notes: dto.notes,
        batchAcceptanceId: dto.batchAcceptanceId
      }
    });

    const nextStatus =
      dto.stage === 'qa'
        ? dto.decision === 'passed'
          ? 'qa_passed'
          : 'qa_rejected'
        : dto.decision === 'passed'
          ? 'sampling_passed'
          : 'sampling_rejected';

    await this.prisma.taskItem.update({
      where: { id: taskId },
      data: { status: nextStatus }
    });

    return review;
  }
}
