import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ROLES_KEY } from './auth.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('Missing token');

    const token = authHeader.replace('Bearer ', '');
    const payload = await this.authService.verifyToken(token);
    request.user = payload;
    return true;
  }
}



@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; 
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('No user found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Requires role: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}