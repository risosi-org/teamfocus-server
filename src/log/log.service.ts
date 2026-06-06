import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AccessControlService } from '../auth/access-control.service';
import { User } from '../generated/prisma/client';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) { }
  async create(createLogDto: CreateLogDto, user: User) {
    const session = await this.accessControl.validateSessionAccess(user, createLogDto.sessionId);
    // update session duration
    await this.prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        duration: {
          increment : createLogDto.duration ?? 0
          }
        }
    })

    
    return await this.prisma.log.create({
      data: createLogDto
    });
  }

  async findAll(sessionId: string, user: User) {
    const session = await this.accessControl.validateSessionAccess(user, sessionId)
    return this.prisma.log.findMany({
      where: { sessionId: { equals: session.id } }
    });
  }

  async remove(id: string, user: User) {
    await this.accessControl.validateLogAccess(user, id)
    return await this.prisma.log.delete({
      where: {
        id
      }
    });
  }

}
