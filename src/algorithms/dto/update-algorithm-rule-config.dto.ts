import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const RULE_CONFIG_STATUSES = ['draft', 'active', 'inactive'] as const;

export class UpdateAlgorithmRuleConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiProperty({ enum: RULE_CONFIG_STATUSES, required: false })
  @IsOptional()
  @IsIn(RULE_CONFIG_STATUSES)
  status?: (typeof RULE_CONFIG_STATUSES)[number];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  effectiveAt?: string;
}
