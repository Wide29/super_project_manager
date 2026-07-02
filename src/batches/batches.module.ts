import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [ProjectsModule],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService]
})
export class BatchesModule {}
