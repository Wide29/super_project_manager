import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTaskSettlementDto } from './dto/create-task-settlement.dto';
import { SettlementsService } from './settlements.service';

@ApiTags('settlements')
@Controller()
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post('tasks/:taskId/settlement')
  create(@Param('taskId') taskId: string, @Body() dto: CreateTaskSettlementDto) {
    return this.settlementsService.create(taskId, dto);
  }
}
