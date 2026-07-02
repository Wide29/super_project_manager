import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService
  ) {}

  async create(projectId: string, data: CreateBatchDto) {
    await this.projectsService.findOne(projectId);

    return this.prisma.batch.create({
      data: {
        ...data,
        projectId
      }
    });
  }

  async findByProject(projectId: string) {
    await this.projectsService.findOne(projectId);

    return this.prisma.batch.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });

    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }

    return batch;
  }

  async update(id: string, data: UpdateBatchDto) {
    await this.findOne(id);

    return this.prisma.batch.update({
      where: { id },
      data
    });
  }
}
