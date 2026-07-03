import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskReviewStageDto {
  QA = 'qa'
}

export enum TaskReviewDecisionDto {
  PASSED = 'passed',
  REJECTED = 'rejected'
}

export class CreateTaskReviewDto {
  @ApiProperty({ enum: TaskReviewStageDto })
  @IsEnum(TaskReviewStageDto)
  stage!: 'qa';

  @ApiProperty({ enum: TaskReviewDecisionDto })
  @IsEnum(TaskReviewDecisionDto)
  decision!: 'passed' | 'rejected';

  @ApiProperty()
  @IsString()
  reviewerId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
