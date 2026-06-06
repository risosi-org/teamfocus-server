import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionService } from './session.service';
import { QuerySessionDto } from './dto/query-session.dto';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  
  @Auth("ADMIN","USER")
  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @CRUser() user: User) {
    return this.sessionService.create(createSessionDto, user);
  }

  @Auth()
  @Get()
  findAll(@Query() query: QuerySessionDto, @CRUser() user: User) {
    return this.sessionService.findAll(query, user);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @CRUser() user: User) {
    return this.sessionService.findOne(id, user);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
  //   return this.sessionService.update(id, updateSessionDto);
  // }

  @Auth("ADMIN","MANAGER")
  @Delete(':id')
  remove(@Param('id') id: string, @CRUser() user: User) {
    return this.sessionService.remove(id, user);
  }
}
