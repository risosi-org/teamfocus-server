import { IsArray, ValidateNested, IsString, IsNotEmpty, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionItemDto {
  @IsString()
  @IsNotEmpty()
  appName!: string;

  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsInt()
  @Min(0)
  durationMs!: number;


  @IsString()
  @IsNotEmpty()
  localDate!: string;
}

export class SyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionItemDto) // Tells class-transformer how to instantiate the items
  sessions!: SessionItemDto[];
}