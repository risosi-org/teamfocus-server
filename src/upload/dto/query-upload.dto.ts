import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class QueryUploadDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;


  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; 

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc'; 

}