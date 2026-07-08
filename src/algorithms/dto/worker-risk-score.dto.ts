import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WorkerRiskScoreDto {
  @ApiProperty()
  @IsString()
  workerId!: string;

  @ApiProperty({ required: false, default: '7d' })
  @IsOptional()
  @IsString()
  windowType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectId?: string;
}
