import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateBatchDeliveryDto } from './dto/create-batch-delivery.dto';
import { DeliveriesService } from './deliveries.service';

@ApiTags('deliveries')
@Controller()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post('batches/:batchId/deliveries')
  create(@Param('batchId') batchId: string, @Body() dto: CreateBatchDeliveryDto) {
    return this.deliveriesService.create(batchId, dto);
  }
}
