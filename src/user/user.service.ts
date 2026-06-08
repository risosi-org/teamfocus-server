import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import fs from "fs/promises";

import { Prisma, User } from '../generated/prisma/client'; // Adjust the import path as necessary
import { QueryUserDto } from './dto/query-user.dto';
import { AccessControlService } from '../auth/access-control.service';


@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) { }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);


    return await this.prisma.user.create({
      data: {
        fullname: createUserDto.fullname,
        email: createUserDto.email,
        passwordHash,
        imageUrl: createUserDto.imageUrl,
      },
      omit: {
        passwordHash: true, // Exclude passwordHash from the result
      }
    });


  }

  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      limit = 10,
      search,
      fullname,
      email,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const filters: Prisma.UserWhereInput = {
      ...(fullname && {
        fullname: {
          contains: fullname,
        } ,
      }),
      ...(email && {
        email: {
          contains: email,
        },
      }),
      ...(role && { role }),
    };

    const where: Prisma.UserWhereInput = {
      AND: [
        filters,
        search
          ? {
            OR: [
              { fullname: { contains: search} },
              { email: { contains: search} },
            ],
          }
          : {},
      ],
    };

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
      omit: {
        passwordHash: true, // Exclude passwordHash from the result
      }
    });

    const total = await this.prisma.user.count({ where });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, actor: User) {
    await this.accessControl.validateUserAccess(actor, id)
    // remove passwordHash from the user object
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: {
        passwordHash: true, // Exclude passwordHash from the result
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, actor: User) {
    await this.accessControl.validateUserAccess(actor, id);
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        fullname: updateUserDto.fullname,
        email: updateUserDto.email,
        role: updateUserDto.role,
        imageUrl: updateUserDto.imageUrl,
      },
      omit: {
        passwordHash: true, // Exclude passwordHash from the result
      }
    });
  }


async remove(id: string, actor: User) {
  await this.accessControl.validateUserAccess(actor, id);

  // 1. Check if the user is currently managing any teams
  const managedTeamsCount = await this.prisma.team.count({
    where: { managerId: id },
  });
  if (managedTeamsCount > 0) {
    throw new BadRequestException(
      'Cannot delete user who is currently managing a team. Please reassign or delete managed teams first.'
    );
  }
  const userUploads = await this.prisma.upload.findMany({
    where: {
      session: { userId: id },
    },
    select: { filepath: true },
  });

  if (userUploads.length > 0) {
    await Promise.all(
      userUploads.map(async (upload) => {
        try {
          const fileExists = await fs.access(upload.filepath)
            .then(() => true)
            .catch(() => false);
          
          if (fileExists) {
            await fs.unlink(upload.filepath);
          }
        } catch (error) {
          console.error(`Failed to delete user physical file: ${upload.filepath}`, error);
        }
      })
    );
  }

  return await this.prisma.user.delete({
    where: { id },
    omit: {
      passwordHash: true,
    },
  });
}
}
