import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Weekday } from '../../generated/prisma/client'; 

export class QuerySessionDto {
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
  userId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; 

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc'; 

}

//
/*
url: /users?page=1&limit=10&search=example&fullname=John
method: GET
description: Query users with pagination, filtering, and sorting
response: [user]
*/