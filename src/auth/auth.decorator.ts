import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from './jwt-auth.guard';
import { User } from '../generated/prisma/client';

export const ROLES_KEY = 'roles';

type roles = "ADMIN"|"USER"|"MANAGER"

export const RoleAuth = (...roles: roles[]) => SetMetadata(ROLES_KEY, roles);


export const Auth = (...roles: roles[])=>{
    if (roles.length === 0) {
        return applyDecorators(
            UseGuards(JwtAuthGuard),
        );
    }
    return applyDecorators(
        RoleAuth(...roles),
        UseGuards(JwtAuthGuard, RolesGuard),
    );
}

export const CRUser = createParamDecorator((_: unknown, ctx: ExecutionContext) : User => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
});