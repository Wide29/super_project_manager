import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTaskReviewDto } from './dto/create-task-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('tasks/:taskId/reviews')
  create(@Param('taskId') taskId: string, @Body() dto: CreateTaskReviewDto) {
    return this.reviewsService.create(taskId, dto);
  }

  @Get('tasks/:taskId/reviews')
  findByTask(@Param('taskId') taskId: string) {
    return this.reviewsService.findByTask(taskId);
  }
}
