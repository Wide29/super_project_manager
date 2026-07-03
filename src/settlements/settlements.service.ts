import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskSettlementDto } from './dto/create-task-settlement.dto';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService
  ) {}

  async create(taskId: string, dto: CreateTaskSettlementDto) {
    await this.tasksService.findOne(taskId);

    const assignments = await this.prisma.taskAssignment.findMany({
      where: { taskItemId: taskId }
    });

    const assignmentIds = new Set(assignments.map((assignment) => assignment.id));

    if (dto.decisionMode === 'split') {
      if (!dto.shares?.length) {
        throw new BadRequestException('shares are required for split settlements');
      }

      const totalShare = dto.shares.reduce((sum, share) => sum + share.percentage, 0);
      if (totalShare !== 100) {
        throw new BadRequestException('split settlement shares must total 100');
      }

      const invalidShare = dto.shares.find((share) => !assignmentIds.has(share.assignmentId));
      if (invalidShare) {
        throw new BadRequestException('all shares must reference assignments on the task');
      }
    } else if (!dto.ownerAssignmentId || !assignmentIds.has(dto.ownerAssignmentId)) {
      throw new BadRequestException(
        'ownerAssignmentId is required and must belong to the task for single_owner settlements'
      );
    }

    return this.prisma.taskSettlement.create({
      data: {
        taskItemId: taskId,
        decisionMode: dto.decisionMode,
        ownerAssignmentId:
          dto.decisionMode === 'single_owner' ? dto.ownerAssignmentId : undefined,
        decidedBy: dto.decidedBy,
        notes: dto.notes,
        shares: dto.decisionMode === 'split'
          ? {
              create: dto.shares!.map((share) => ({
                assignmentId: share.assignmentId,
                percentage: share.percentage
              }))
            }
          : dto.ownerAssignmentId
            ? {
                create: [
                  {
                    assignmentId: dto.ownerAssignmentId,
                    percentage: 100
                  }
                ]
              }
            : undefined
      },
      include: {
        shares: true
      }
    });
  }
}
