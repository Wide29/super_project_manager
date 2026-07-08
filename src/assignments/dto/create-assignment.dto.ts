import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskAssignmentStatusDto {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  TRANSFERRED = 'transferred'
}

export class CreateAssignmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;

  @ApiProperty()
  @IsString()
  assigneeId!: string;

  @ApiProperty({ enum: TaskAssignmentStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskAssignmentStatusDto)
  status?: TaskAssignmentStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recommendationRequestId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectedByUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  selectionSource?: string;
}
