import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BatchesService } from '../batches/batches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskImportItemDto } from './dto/import-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService
  ) {}

  async create(batchId: string, data: CreateTaskDto) {
    await this.batchesService.findOne(batchId);
    const { inputPayload, ...rest } = data;

    return this.prisma.taskItem.create({
      data: {
        ...rest,
        batchId,
        inputPayload: inputPayload as Prisma.InputJsonValue
      }
    });
  }

  async import(batchId: string, items: CreateTaskImportItemDto[]) {
    await this.batchesService.findOne(batchId);

    const createdTasks = await this.prisma.$transaction((tx) =>
      Promise.all(
        items.map((item) =>
          tx.taskItem.create({
            data: {
              batchId,
              externalRef: item.externalRef,
              title: item.title,
              inputPayload: item.inputPayload as Prisma.InputJsonValue,
              status: item.status,
              priority: item.priority ?? 0
            },
            select: {
              id: true,
              title: true
            }
          })
        )
      )
    );

    return {
      createdCount: createdTasks.length,
      tasks: createdTasks
    };
  }

  async findByBatch(batchId: string) {
    await this.batchesService.findOne(batchId);

    return this.prisma.taskItem.findMany({
      where: { batchId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.taskItem.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    await this.findOne(id);
    const { inputPayload, ...rest } = data;

    return this.prisma.taskItem.update({
      where: { id },
      data: {
        ...rest,
        ...(inputPayload !== undefined
          ? { inputPayload: inputPayload as Prisma.InputJsonValue }
          : {})
      }
    });
  }

  async getNextForAssignee(assigneeId: string) {
    const assignment = await this.prisma.taskAssignment.findFirst({
      where: {
        assigneeId,
        status: {
          in: ['assigned', 'accepted']
        }
      },
      orderBy: {
        assignedAt: 'asc'
      },
      include: {
        taskItem: true
      }
    });

    return assignment?.taskItem ?? null;
  }

  async submit(
    id: string,
    assigneeId: string,
    outputPayload: Record<string, unknown>,
    notes?: string
  ) {
    await this.findOne(id);

    await this.prisma.taskAssignment.updateMany({
      where: {
        taskItemId: id,
        assigneeId
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes
      }
    });

    return this.prisma.taskItem.update({
      where: { id },
      data: {
        status: 'submitted',
        inputPayload: outputPayload as Prisma.InputJsonValue
      }
    });
  }
}
