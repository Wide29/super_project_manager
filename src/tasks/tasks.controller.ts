import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('batches/:batchId/tasks')
  create(@Param('batchId') batchId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(batchId, dto);
  }

  @Get('batches/:batchId/tasks')
  findByBatch(@Param('batchId') batchId: string) {
    return this.tasksService.findByBatch(batchId);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
}
