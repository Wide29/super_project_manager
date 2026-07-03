import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AcceptancesService } from './acceptances.service';
import { CreateBatchAcceptanceDto } from './dto/create-batch-acceptance.dto';

@ApiTags('acceptances')
@Controller()
export class AcceptancesController {
  constructor(private readonly acceptancesService: AcceptancesService) {}

  @Post('deliveries/:deliveryId/acceptances')
  create(@Param('deliveryId') deliveryId: string, @Body() dto: CreateBatchAcceptanceDto) {
    return this.acceptancesService.create(deliveryId, dto);
  }
}
