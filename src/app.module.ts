import { ActivityModule } from './activity/activity.module';
import { LogModule } from './log/log.module';
import { SessionModule } from './session/session.module';
import { UploadModule } from './upload/upload.module';
import { TeamModule } from './team/team.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ ActivityModule, LogModule, SessionModule, UploadModule, TeamModule,PrismaModule, UserModule, AuthModule,],
})
export class AppModule { }
