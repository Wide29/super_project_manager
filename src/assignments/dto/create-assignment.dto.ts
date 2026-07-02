import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskAssignmentStatusDto {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
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
}
