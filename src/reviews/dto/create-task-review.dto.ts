import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskReviewStageDto {
  QA = 'qa',
  ALGORITHM_SAMPLING = 'algorithm_sampling'
}

export enum TaskReviewDecisionDto {
  PASSED = 'passed',
  REJECTED = 'rejected'
}

export class CreateTaskReviewDto {
  @ApiProperty({ enum: TaskReviewStageDto })
  @IsEnum(TaskReviewStageDto)
  stage!: 'qa' | 'algorithm_sampling';

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  batchAcceptanceId?: string;
}
