import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Session, Log, Upload, Team } from '../generated/prisma/client';
import { SessionInclude } from '../generated/prisma/models';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * LEVEL 1: Validate if an actor can access a specific User profile/resource
   */
  async validateUserAccess(actor: User, targetUserId: string): Promise<string> {
    if (actor.role === 'ADMIN') return targetUserId;

    if (actor.role === 'USER') {
      if (actor.id !== targetUserId) throw new NotFoundException('User not found');
      return targetUserId;
    }

    if (actor.role === 'MANAGER') {
      const isTeamMember = await this.checkManagerOwnership(actor.id, targetUserId);
      if (!isTeamMember) throw new NotFoundException('User not found');
      return targetUserId;
    }

    throw new ForbiddenException('Access denied');
  }

  /**
   * LEVEL 2: Validate if an actor can access a specific Session bucket
   */
  async validateSessionAccess(actor: User, sessionId: string, includes?: SessionInclude): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      ...(includes && { include:includes })
    });

    if (!session) throw new NotFoundException('Session not found');

    // Run the session's owner through the Level 1 validation rules
    await this.validateUserAccess(actor, session.userId);
    
    return session;
  }

  /**
   * LEVEL 3: Validate if an actor can access a deeply nested individual Log entry
   */
  async validateLogAccess(actor: User, logId: string): Promise<Log> {
    const log = await this.prisma.log.findUnique({
      where: { id: logId },
      include: { session: true },
    });

    if (!log || !log.session) throw new NotFoundException('Log not found');

    // Run the log's parent session owner through the Level 1 validation rules
    await this.validateUserAccess(actor, log.session.userId);

    return log;
  }

  async validateUploadAccess(actor: User, uploadId: string): Promise<Upload> {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { session: true },
    });

    if (!upload || !upload.session) throw new NotFoundException('upload not found');

    // Run the upload's parent session owner through the Level 1 validation rules
    await this.validateUserAccess(actor, upload.session.userId);

    return upload;
  }

  /**
   * LEVEL 4: Validate if an actor can access a specific Team
   */
  async validateTeamAccess(actor: User, teamId: string): Promise<Team> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) throw new NotFoundException('Team not found');

    if (actor.role === 'ADMIN') return team;

    if (actor.role === 'MANAGER') {
      if (team.managerId !== actor.id) throw new NotFoundException('Team not found');
      return team;
    }

    if (actor.role === 'USER') {
      if (actor.teamId !== teamId) throw new NotFoundException('Team not found');
      return team;
    }

    throw new ForbiddenException('Access denied');
  }

  /**
   * Shared Database lookup helper for Manager permissions
   */
  private async checkManagerOwnership(managerId: string, memberId: string): Promise<boolean> {
    const team = await this.prisma.team.findFirst({
      where: {
        managerId: managerId,
        members: { some: { id: memberId } },
      },
      select: { id: true }
    });
    return !!team;
  }
}