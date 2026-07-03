import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { TransferAssignmentDto } from './dto/transfer-assignment.dto';

@ApiTags('assignments')
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('tasks/:taskId/assignments')
  create(@Param('taskId') taskId: string, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(taskId, dto);
  }

  @Get('tasks/:taskId/assignments')
  findByTask(@Param('taskId') taskId: string) {
    return this.assignmentsService.findByTask(taskId);
  }

  @Post('assignments/:assignmentId/transfer')
  transfer(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: TransferAssignmentDto
  ) {
    return this.assignmentsService.transfer(assignmentId, dto);
  }
}
