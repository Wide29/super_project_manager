import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { BatchesModule } from './batches/batches.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    BatchesModule,
    TasksModule,
    AssignmentsModule
  ]
})
export class AppModule {}
