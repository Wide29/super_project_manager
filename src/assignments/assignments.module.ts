import { Module } from '@nestjs/common';
import { AlgorithmsModule } from '../algorithms/algorithms.module';
import { TasksModule } from '../tasks/tasks.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [TasksModule, AlgorithmsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService]
})
export class AssignmentsModule {}
