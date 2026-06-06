import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Prisma, User } from '../generated/prisma/client'; // Adjust the import path as necessary
import { PrismaService } from '../prisma/prisma.service';
import { QuerySessionDto } from './dto/query-session.dto';
import { AccessControlService } from '../auth/access-control.service';


@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) { }


  
  async create(createSessionDto: CreateSessionDto, user: User) {
   
    // check session exists for the user on the same weekday
    const session = await this.prisma.session.upsert({
      where: {
        userId_dateStamp: {
          userId: user.id,
          dateStamp: createSessionDto.dateStamp,
        },
      },
      update: {},
      create: {
        userId: user.id,
        dateStamp: createSessionDto.dateStamp,
      }
    });

    return session;
  }

  async findAll(query: QuerySessionDto, user: User) {
    const {
      page = 1,
      limit = 10,
      search,
      userId: uId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const userId = uId ? await this.accessControl.validateUserAccess(user, uId): (user.role==="ADMIN"? undefined : user.id);

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.SessionWhereInput = {
      ...(userId && { userId }),
      ...(search && {
        dateStamp: {
          contains: search,
        }
      }),
    };



    const sessions = await this.prisma.session.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      }
    });



    const total = await this.prisma.session.count({ where });


    return {
      data: sessions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, user: User) {
    return await this.accessControl.validateSessionAccess(user, id, {
      logs: true,
      uploads: true
    })
  }


  async update(id: string, updateSessionDto: UpdateSessionDto) {
    return await this.prisma.session.update({
      where: { id },
      data: updateSessionDto,
    });
  }

  
  async remove(id: string, user: User) {
    await this.accessControl.validateSessionAccess(user, id)
    return await this.prisma.session.delete({
      where: { id },
    });
  }

}

