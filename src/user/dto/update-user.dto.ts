import { Role } from '../../generated/prisma/client'; // Adjust the import path as necessary
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  fullname?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  imageUrl?: string;
}

/*
url: /users/:id
method: PATCH
description: Update an existing user
body:
{
  "fullname": "Updated User Name",
  "email": "ytytfrytrytfhgf",
  "role": "ADMIN",
  "imageUrl": "http://example.com/updated-image.jpg"
}
response: any
*/