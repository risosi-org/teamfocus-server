import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../../generated/prisma/client'; 

export class QueryUserDto {
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
  fullname?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; 

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc'; 


  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

//
/*
url: /users?page=1&limit=10&search=example&fullname=John
method: GET
description: Query users with pagination, filtering, and sorting
response: [user]
*/