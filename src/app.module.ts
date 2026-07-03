import { Module } from '@nestjs/common';
import { AcceptancesModule } from './acceptances/acceptances.module';
import { AiModule } from './ai/ai.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { BatchesModule } from './batches/batches.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettlementsModule } from './settlements/settlements.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    BatchesModule,
    TasksModule,
    AssignmentsModule,
    ReviewsModule,
    DeliveriesModule,
    AcceptancesModule,
    SettlementsModule,
    DashboardModule,
    AiModule
  ]
})
export class AppModule {}
