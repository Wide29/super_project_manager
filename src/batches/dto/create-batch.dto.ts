import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum BatchStatusDto {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  DELIVERED = 'delivered',
  PARTIALLY_REJECTED = 'partially_rejected',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CLOSED = 'closed'
}

export class CreateBatchDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: BatchStatusDto, required: false })
  @IsOptional()
  @IsEnum(BatchStatusDto)
  status?: BatchStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  plannedTaskCount?: number;
}
