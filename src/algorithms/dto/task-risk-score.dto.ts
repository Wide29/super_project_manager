import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TaskRiskScoreDto {
  @ApiProperty()
  @IsString()
  taskId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workerId?: string;
}
