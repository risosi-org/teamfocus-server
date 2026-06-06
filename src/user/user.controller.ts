import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

import { UserService } from './user.service';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth("ADMIN")
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Auth("ADMIN")
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string , @CRUser() user: User) {
    return this.userService.findOne(id, user);
  }

  @Auth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CRUser() user:User) {
    return this.userService.update(id, updateUserDto, user);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string, @CRUser() user:User) {
    return this.userService.remove(id, user);
  }
}
