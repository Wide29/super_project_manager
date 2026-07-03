import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export enum TaskItemStatusDto {
  PENDING_ALLOCATION = 'pending_allocation',
  PENDING_PICKUP = 'pending_pickup',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  QA_REJECTED = 'qa_rejected',
  QA_PASSED = 'qa_passed',
  DELIVERED = 'delivered',
  SAMPLING_REJECTED = 'sampling_rejected',
  SAMPLING_PASSED = 'sampling_passed'
}

export class CreateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  inputPayload!: Record<string, unknown>;

  @ApiProperty({ enum: TaskItemStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskItemStatusDto)
  status?: TaskItemStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}
