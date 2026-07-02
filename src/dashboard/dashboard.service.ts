import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [projectCount, batchCount, taskCount, assignmentCount] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.batch.count(),
      this.prisma.taskItem.count(),
      this.prisma.taskAssignment.count()
    ]);

    return { projectCount, batchCount, taskCount, assignmentCount };
  }
}
