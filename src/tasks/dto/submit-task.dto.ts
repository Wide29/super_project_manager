import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SubmitTaskDto {
  @ApiProperty()
  @IsString()
  assigneeId!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  outputPayload!: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
