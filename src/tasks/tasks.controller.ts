import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { ImportTasksDto } from './dto/import-tasks.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
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

  @Post('batches/:batchId/tasks/import')
  import(@Param('batchId') batchId: string, @Body() dto: ImportTasksDto) {
    return this.tasksService.import(batchId, dto.tasks);
  }

  @Get('batches/:batchId/tasks')
  findByBatch(@Param('batchId') batchId: string) {
    return this.tasksService.findByBatch(batchId);
  }

  @Get('tasks/queue/next')
  getNext(@Query('assigneeId') assigneeId: string) {
    return this.tasksService.getNextForAssignee(assigneeId);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Post('tasks/:id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitTaskDto) {
    return this.tasksService.submit(id, dto.assigneeId, dto.outputPayload, dto.notes);
  }
}
