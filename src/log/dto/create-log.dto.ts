import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLogDto {
  @IsString()
  action!: string;

  @IsString()
  sessionId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;
}
