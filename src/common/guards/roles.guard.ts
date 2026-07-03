import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // TEMP DEBUG — remove after confirming
    console.log('RolesGuard check:', {
      requiredRoles,
      userRole: user?.role,
      userExists: !!user,
      match: requiredRoles.some((role) => user?.role === role),
    });

    return requiredRoles.some((role) => user.role === role);
  }
}