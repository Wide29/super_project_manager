import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from 'class-validator';
import { TaskItemStatusDto } from './create-task.dto';

export class CreateTaskImportItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalRef?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  inputPayload!: Record<string, unknown>;

  @ApiProperty({ enum: TaskItemStatusDto, required: false })
  @IsOptional()
  @IsEnum(TaskItemStatusDto)
  status?: TaskItemStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class ImportTasksDto {
  @ApiProperty({ type: [CreateTaskImportItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskImportItemDto)
  tasks!: CreateTaskImportItemDto[];
}
