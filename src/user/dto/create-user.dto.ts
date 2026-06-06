import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  fullname!: string;

  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  // image
  @IsOptional()
  @IsString()
  imageUrl?: string;
}


/*
url: /users
method: POST
description: Create a new user
body:
{
  "fullname": "John Doe",
  "email": "example@gmail.com",
  "password": "securepassword",
  "imageUrl": "http://example.com/image.jpg"
}
response: any
*/