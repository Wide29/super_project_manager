import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { BatchesModule } from './batches/batches.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    BatchesModule,
    TasksModule,
    AssignmentsModule,
    DashboardModule,
    AiModule
  ]
})
export class AppModule {}
