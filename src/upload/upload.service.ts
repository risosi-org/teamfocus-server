import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import fs, { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUploadDto } from './dto/query-upload.dto';
import { Prisma } from '../generated/prisma/browser';
import { User } from '../generated/prisma/client';
import { AccessControlService } from '../auth/access-control.service';

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService, private accessControl: AccessControlService) { }

  async upload(file: Express.Multer.File, sessionId: string, req: Request) {
    try {
      const hashFilename = this.generateHashFilename(file.originalname);
      const subdir = this.getSubdir(file.mimetype);

      const uploadDir = join(__dirname, '..', '..', 'uploads', subdir);

      await mkdir(uploadDir, { recursive: true });

      const uploadPath = join(__dirname, '..', '..', 'uploads', subdir, hashFilename);

      if (await this.isExists(uploadPath)) {
        throw new ConflictException('File already exists');
      }


      const session = await this.prisma.session.findFirst({
        where: {
          AND: [{
            id: { equals: sessionId }
          }, {
            userId: {
              equals: (req as any).user.id
            }
          }]
        }
      })

      if (!session) throw new ConflictException("session and user id didn't match");


      const data = await this.create({
        url: `uploads/${subdir}/${hashFilename}`,   // apiBase/+url
        filepath: uploadPath,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        sessionId: session.id,
      });

      await writeFile(uploadPath, file.buffer);

      return data;
    } catch (error) {

      throw new InternalServerErrorException((error as Error).message || 'Failed to upload file');
    }
  }
  async create(createUploadDto: CreateUploadDto) {
    return this.prisma.upload.create({ data: createUploadDto });
  }

  async findAll(query: QueryUploadDto, user: User) {
    const {
      page = 1,
      limit = 10,
      search,
      sessionId: sId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const sessionId = sId ? (await this.accessControl.validateSessionAccess(user, sId??"")).id : undefined;

    if (!sessionId && user.role!=="ADMIN") throw new ForbiddenException("invalid access");

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const where: Prisma.UploadWhereInput = {
      ...(sessionId && {sessionId}),
      ...(search
      ? {
        OR: [
          { filename: { contains: search } },
          { mimetype: { contains: search } },
        ],
      }
      : {})
    };

    const uploads = await this.prisma.upload.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const total = await this.prisma.upload.count({ where });


    return {
      data: uploads,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };


  }

  async findOne(id: string, user: User) {
    const upload = await this.accessControl.validateUploadAccess(user, id);
    if (!upload) {
      throw new NotFoundException('upload not found');
    }
    return upload;
  }

  async remove(id: string, user: User) {
    await this.accessControl.validateUploadAccess(user, id);
    try {
      const uploaded = await this.prisma.upload.delete({ where: { id } });
      await (this.deleteFile(uploaded.filepath).then(e=>0).catch(e=>0));
      return uploaded;
    } catch (error) {
      throw new NotFoundException((error as Error).message || 'Failed to delete file');
    }
  }


  async deleteFile(filepath: string) { // this function is not used in the controller, but can be used in the future for deleting files from the server
    try {
      if (!await this.isExists(filepath)) {
        throw new Error('File not found');
      }
      await fs.unlink(filepath);
    } catch (error) {
      throw new Error('Failed to delete file');
    }
  }


  async isExists(filepath: string) {
    return fs.access(filepath).then(() => true).catch(() => false);
  }
  generateHashFilename(filename: string) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = this.getExtension(filename);
    return `${timestamp}-${random}.${ext}`;
  }
  getExtension(filename: string) {
    return filename.split('.').pop();
  }

  getSubdir(mimeType: string) {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/png':
        return 'images';
      case 'application/pdf':
        return 'documents';
      default:
        return 'misc';
    }
  }
}
