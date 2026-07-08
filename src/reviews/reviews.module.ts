import { Module } from '@nestjs/common';
import { AlgorithmsModule } from '../algorithms/algorithms.module';
import { TasksModule } from '../tasks/tasks.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TasksModule, AlgorithmsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService]
})
export class ReviewsModule {}
