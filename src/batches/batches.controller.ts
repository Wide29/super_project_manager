import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { BatchesService } from './batches.service';

@ApiTags('batches')
@Controller()
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post('projects/:projectId/batches')
  create(@Param('projectId') projectId: string, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(projectId, dto);
  }

  @Get('projects/:projectId/batches')
  findByProject(@Param('projectId') projectId: string) {
    return this.batchesService.findByProject(projectId);
  }

  @Get('batches/:id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch('batches/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.batchesService.update(id, dto);
  }
}
