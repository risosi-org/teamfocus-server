import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

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
    await this.accessControl.validateUserAccess(actor, id)
    return this.prisma.user.delete({
      where: { id },
      omit: {
        passwordHash: true, // Exclude passwordHash from the result
      }
    });
  }
}
