import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TaskSuggestionDto {
  @ApiProperty()
  @IsString()
  taskId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prompt?: string;
}
