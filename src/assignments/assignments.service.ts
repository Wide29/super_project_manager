import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService
  ) {}

  async create(taskId: string, data: CreateAssignmentDto) {
    await this.tasksService.findOne(taskId);

    return this.prisma.taskAssignment.create({
      data: {
        ...data,
        taskItemId: taskId
      }
    });
  }

  async findByTask(taskId: string) {
    await this.tasksService.findOne(taskId);

    return this.prisma.taskAssignment.findMany({
      where: { taskItemId: taskId },
      orderBy: { assignedAt: 'desc' }
    });
  }
}
