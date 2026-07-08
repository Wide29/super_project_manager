import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BatchSamplingPlanDto {
  @ApiProperty()
  @IsString()
  batchId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectId?: string;
}
