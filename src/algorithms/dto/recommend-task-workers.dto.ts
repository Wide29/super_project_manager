import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class RecommendTaskWorkersDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiProperty()
  @IsString()
  batchId!: string;

  @ApiProperty()
  @IsString()
  taskId!: string;

  @ApiProperty()
  @IsString()
  taskType!: string;

  @ApiProperty()
  @IsString()
  mediaType!: string;

  @ApiProperty({ required: false, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  candidateWorkerIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
