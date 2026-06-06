import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { LogService } from './log.service';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Auth("ADMIN","USER")
  @Post()
  create(@Body() createLogDto: CreateLogDto, @CRUser() user: User) {
    return this.logService.create(createLogDto, user);
  }

  @Auth()
  @Get()
  async findAll(@Query("sessionID") sessionId:string, @CRUser() user: User) {
    return await this.logService.findAll(sessionId, user);
  }

  @Auth("ADMIN", "MANAGER")
  @Delete(':id')
  remove(@Param('id') id: string, @CRUser() user: User) {
    return this.logService.remove(id, user);
  }
}
