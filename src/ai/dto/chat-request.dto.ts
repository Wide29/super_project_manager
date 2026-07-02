import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  context?: string;
}
