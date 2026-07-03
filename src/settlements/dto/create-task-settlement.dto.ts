import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';

export enum TaskSettlementDecisionModeDto {
  SINGLE_OWNER = 'single_owner',
  SPLIT = 'split'
}

export enum TaskSettlementDeciderRoleDto {
  PROJECT_MANAGER = 'project_manager',
  OPERATIONS = 'operations'
}

class TaskSettlementShareDto {
  @ApiProperty()
  @IsString()
  assignmentId!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentage!: number;
}

export class CreateTaskSettlementDto {
  @ApiProperty({ enum: TaskSettlementDecisionModeDto })
  @IsEnum(TaskSettlementDecisionModeDto)
  decisionMode!: 'single_owner' | 'split';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerAssignmentId?: string;

  @ApiProperty()
  @IsString()
  decidedBy!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [TaskSettlementShareDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayUnique((share: TaskSettlementShareDto) => share.assignmentId)
  @ValidateNested({ each: true })
  @Type(() => TaskSettlementShareDto)
  shares?: TaskSettlementShareDto[];

  @ApiProperty({ enum: TaskSettlementDeciderRoleDto })
  @IsEnum(TaskSettlementDeciderRoleDto)
  decidedByRole!: 'project_manager' | 'operations';
}
