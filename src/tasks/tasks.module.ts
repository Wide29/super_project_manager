import { Module } from '@nestjs/common';
import { AlgorithmsModule } from '../algorithms/algorithms.module';
import { BatchesModule } from '../batches/batches.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [BatchesModule, AlgorithmsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService]
})
export class TasksModule {}
