import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from '../auth/access-control.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { QueryTeamDto } from './dto/query-team.dto';
import { Prisma, User } from '../generated/prisma/client';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async create(createTeamDto: CreateTeamDto, actor: User) {
    // If actor is a MANAGER, ensure they can only create teams where they are the manager
    if (actor.role === 'MANAGER' && createTeamDto.managerId !== actor.id) {
      throw new ForbiddenException('Managers can only create teams they manage');
    }

    // Verify manager exists and is a MANAGER or ADMIN
    const managerUser = await this.prisma.user.findUnique({
      where: { id: createTeamDto.managerId },
    });
    if (!managerUser) {
      throw new NotFoundException('Manager not found');
    }
    if (managerUser.role !== 'MANAGER' && managerUser.role !== 'ADMIN') {
      throw new BadRequestException('Target user is not a manager or admin');
    }

    // Verify team name is unique
    const existing = await this.prisma.team.findUnique({
      where: { name: createTeamDto.name },
    });
    if (existing) {
      throw new ConflictException('Team name already in use');
    }

    return this.prisma.team.create({
      data: {
        name: createTeamDto.name,
        managerId: createTeamDto.managerId,
      },
      include: {
        manager: {
          select: { id: true, fullname: true, email: true, role: true, imageUrl: true }
        }
      }
    });
  }

  async findAll(query: QueryTeamDto, actor: User) {
    const {
      page = 1,
      limit = 10,
      search,
      name,
      managerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const filters: Prisma.TeamWhereInput = {
      ...(name && { name: { contains: name } }),
      ...(managerId && { managerId }),
    };

    // If manager, restrict to teams they manage
    if (actor.role === 'MANAGER') {
      filters.managerId = actor.id;
    }

    // Apply search filter (searches team name or manager name)
    const searchFilter: Prisma.TeamWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            {
              manager: {
                fullname: { contains: search },
              },
            },
          ],
        }
      : {};

    const where: Prisma.TeamWhereInput = {
      AND: [filters, searchFilter],
    };

    const teams = await this.prisma.team.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        manager: {
          select: { id: true, fullname: true, email: true, role: true, imageUrl: true }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    const total = await this.prisma.team.count({ where });

    return {
      data: teams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, actor: User) {
    await this.accessControl.validateTeamAccess(actor, id);

    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullname: true, email: true, role: true, imageUrl: true }
        },
        members: {
          select: { id: true, fullname: true, email: true, role: true, imageUrl: true }
        }
      }
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, actor: User) {
    const team = await this.accessControl.validateTeamAccess(actor, id);

    // Verify name uniqueness if name is changing
    if (updateTeamDto.name && updateTeamDto.name !== team.name) {
      const existing = await this.prisma.team.findUnique({
        where: { name: updateTeamDto.name },
      });
      if (existing) {
        throw new ConflictException('Team name already in use');
      }
    }

    // Verify manager checks if managerId is changing
    if (updateTeamDto.managerId && updateTeamDto.managerId !== team.managerId) {
      if (actor.role !== 'ADMIN') {
        throw new ForbiddenException('Only admins can change team manager');
      }

      const managerUser = await this.prisma.user.findUnique({
        where: { id: updateTeamDto.managerId },
      });
      if (!managerUser) {
        throw new NotFoundException('Manager not found');
      }
      if (managerUser.role !== 'MANAGER' && managerUser.role !== 'ADMIN') {
        throw new BadRequestException('Target user is not a manager or admin');
      }
    }

    return this.prisma.team.update({
      where: { id },
      data: {
        name: updateTeamDto.name,
        managerId: updateTeamDto.managerId,
      },
      include: {
        manager: {
          select: { id: true, fullname: true, email: true, role: true, imageUrl: true }
        }
      }
    });
  }

  async remove(id: string, actor: User) {
    await this.accessControl.validateTeamAccess(actor, id);

    // Update members of this team to null teamId first
    await this.prisma.user.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });

    return this.prisma.team.delete({
      where: { id },
    });
  }

  async join(teamId: string, actor: User, who: string) {

    this.accessControl.validateUserAccess(actor, who);

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Update the actor user's teamId
    await this.prisma.user.update({
      where: { id: who },
      data: { teamId },
    });

    return {
      message: 'Successfully joined the team',
      teamId,
    };
  }

  async exit(teamId: string, actor: User, who: string) {
    
    this.accessControl.validateUserAccess(actor, who);

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is in this team
    const currentUser = await this.prisma.user.findUnique({
      where: { id: who },
      select: { teamId: true },
    });

    if (currentUser?.teamId !== teamId) {
      throw new BadRequestException('You are not a member of this team');
    }

    // Set user's teamId to null
    await this.prisma.user.update({
      where: { id: actor.id },
      data: { teamId: null },
    });

    return {
      message: 'Successfully exited the team',
    };
  }
}
