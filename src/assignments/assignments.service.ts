import { Injectable } from '@nestjs/common';
import { AlgorithmsService } from '../algorithms/algorithms.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { TransferAssignmentDto } from './dto/transfer-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly algorithmsService: AlgorithmsService
  ) {}

  async create(taskId: string, data: CreateAssignmentDto) {
    await this.tasksService.findOne(taskId);

    const assignment = await this.prisma.taskAssignment.create({
      data: {
        operatorId: data.operatorId,
        assigneeId: data.assigneeId,
        status: data.status,
        notes: data.notes,
        taskItemId: taskId
      }
    });

    await this.algorithmsService.recordRecommendationSelection({
      taskId,
      requestId: data.recommendationRequestId,
      selectedWorkerId: assignment.assigneeId,
      selectedByUserId: data.selectedByUserId,
      selectionSource: data.selectionSource
    });

    return assignment;
  }

  async findByTask(taskId: string) {
    await this.tasksService.findOne(taskId);

    return this.prisma.taskAssignment.findMany({
      where: { taskItemId: taskId },
      orderBy: { assignedAt: 'desc' }
    });
  }

  async transfer(assignmentId: string, dto: TransferAssignmentDto) {
    const assignment = await this.prisma.taskAssignment.findUniqueOrThrow({
      where: { id: assignmentId }
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.taskAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'transferred',
          completedAt: new Date(),
          notes: dto.notes ?? assignment.notes,
          transferReason: dto.transferReason
        }
      });

      return tx.taskAssignment.create({
        data: {
          taskItemId: assignment.taskItemId,
          assigneeId: dto.nextAssigneeId,
          operatorId: assignment.operatorId,
          sourceAssignmentId: assignment.id,
          notes: dto.notes
        }
      });
    });
  }
}
