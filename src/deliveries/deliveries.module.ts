import { Module } from '@nestjs/common';
import { BatchesModule } from '../batches/batches.module';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  imports: [BatchesModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService]
})
export class DeliveriesModule {}
