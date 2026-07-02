import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BatchesService } from '../batches/batches.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
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
}
