import { AccessControlService } from './access-control.service';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import 'dotenv/config'


@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ,
      signOptions: { expiresIn: '24h' }, // 24 hours
    }),
  ],
  providers: [ AccessControlService,AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AccessControlService],
})

export class AuthModule {}