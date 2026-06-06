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
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { QueryTeamDto } from './dto/query-team.dto';
import { TeamService } from './team.service';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Auth("ADMIN", "MANAGER")
  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @CRUser() user: User) {
    return this.teamService.create(createTeamDto, user);
  }

  @Auth("ADMIN", "MANAGER")
  @Get()
  findAll(@Query() query: QueryTeamDto, @CRUser() user: User) {
    return this.teamService.findAll(query, user);
  }

  @Auth("ADMIN", "MANAGER")
  @Get(':tid')
  findOne(@Param('tid') id: string, @CRUser() user: User) {
    return this.teamService.findOne(id, user);
  }

  @Auth("ADMIN", "MANAGER")
  @Patch(':tid')
  update(
    @Param('tid') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @CRUser() user: User,
  ) {
    return this.teamService.update(id, updateTeamDto, user);
  }

  @Auth("ADMIN", "MANAGER")
  @Delete(':tid')
  remove(@Param('tid') id: string, @CRUser() user: User) {
    return this.teamService.remove(id, user);
  }

  @Auth()
  @Get('join/:tid')
  join(@Param('tid') id: string, @CRUser() user: User) {
    return this.teamService.join(id, user);
  }

  @Auth()
  @Get('exit/:tid')
  exit(@Param('tid') id: string, @CRUser() user: User) {
    return this.teamService.exit(id, user);
  }
}
