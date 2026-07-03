import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export enum BatchAcceptanceDecisionDto {
  ACCEPTED = 'accepted',
  PARTIALLY_REJECTED = 'partially_rejected',
  REJECTED = 'rejected'
}

export class CreateBatchAcceptanceDto {
  @ApiProperty()
  @IsString()
  reviewedBy!: string;

  @ApiProperty({ enum: BatchAcceptanceDecisionDto })
  @IsEnum(BatchAcceptanceDecisionDto)
  decision!: 'accepted' | 'partially_rejected' | 'rejected';

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sampleSize!: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  sampledTaskIds!: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  rejectedTaskIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
