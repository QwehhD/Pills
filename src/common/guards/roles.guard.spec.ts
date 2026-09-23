import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

const contextWith = (user?: { role: Role }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

const guardRequiring = (roles?: Role[]) => {
  const reflector = {
    getAllAndOverride: () => roles,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('meneruskan route yang tidak memakai @Roles', () => {
    const guard = guardRequiring(undefined);
    expect(guard.canActivate(contextWith({ role: Role.PATIENT }))).toBe(true);
  });

  it('meneruskan role yang cocok', () => {
    const guard = guardRequiring([Role.DOCTOR]);
    expect(guard.canActivate(contextWith({ role: Role.DOCTOR }))).toBe(true);
  });

  it('menolak role yang tidak cocok', () => {
    const guard = guardRequiring([Role.DOCTOR]);
    expect(() =>
      guard.canActivate(contextWith({ role: Role.PATIENT })),
    ).toThrow(ForbiddenException);
  });

  it('menolak request tanpa user', () => {
    const guard = guardRequiring([Role.DOCTOR]);
    expect(() => guard.canActivate(contextWith())).toThrow(ForbiddenException);
  });
});