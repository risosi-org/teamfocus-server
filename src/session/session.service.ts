import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Prisma, User, Session } from '../generated/prisma/client'; // Adjust the import path as necessary
import { PrismaService } from '../prisma/prisma.service';
import { QuerySessionDto } from './dto/query-session.dto';
import { AccessControlService } from '../auth/access-control.service';
import fs from 'fs/promises';

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

    const userId = uId ? await this.accessControl.validateUserAccess(user, uId) : (user.role === "ADMIN" ? undefined : user.id);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

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
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
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
    
    const session = await this.accessControl.validateSessionAccess(user, id, {
      uploads: true,
    }) as Session & { uploads?: Array<{ filepath: string }> };
    if (session.uploads && session.uploads.length > 0) {
      await Promise.all(
        session.uploads.map(async (upload) => {
          try {
            const fileExists = await fs.access(upload.filepath)
              .then(() => true)
              .catch(() => false);

            if (fileExists) {
              await fs.unlink(upload.filepath);
            }
          } catch (error) {
            console.error(`Failed to delete physical file: ${upload.filepath}`, error);
          }
        })
      );
    }
    return await this.prisma.session.delete({
      where: { id },
    });
  }

}

