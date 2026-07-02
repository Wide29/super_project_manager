import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ProjectStatusDto {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ProjectStatusDto, required: false })
  @IsOptional()
  @IsEnum(ProjectStatusDto)
  status?: ProjectStatusDto;

  @ApiProperty()
  @IsString()
  taskType!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sopDocument?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  acceptanceCriteria?: string;
}
