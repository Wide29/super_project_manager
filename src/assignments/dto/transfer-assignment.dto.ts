import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TaskTransferReasonDto {
  OFFBOARDED = 'offboarded',
  LEAVE = 'leave',
  CAPACITY_REBALANCE = 'capacity_rebalance',
  REWORK = 'rework',
  MANUAL = 'manual'
}

export class TransferAssignmentDto {
  @ApiProperty()
  @IsString()
  nextAssigneeId!: string;

  @ApiProperty({ enum: TaskTransferReasonDto })
  @IsEnum(TaskTransferReasonDto)
  transferReason!: TaskTransferReasonDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
