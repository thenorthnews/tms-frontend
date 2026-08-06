import * as React from 'react';

import { UserRole, normalizeRole } from '@/utils/roles';

import { useUser } from './auth';

export { UserRole };

export enum ROLES {
  CEO = 'CEO',
  MANAGER = 'MANAGER',
  TL = 'TL',
  EMPLOYEE = 'EMPLOYEE',
}

type RoleTypes = keyof typeof ROLES;

export const useAuthorization = () => {
  const user = useUser();

  if (!user.data) {
    throw Error('User does not exist!');
  }

  const checkAccess = React.useCallback(
    ({ allowedRoles }: { allowedRoles: RoleTypes[] }) => {
      if (allowedRoles && allowedRoles.length > 0 && user.data) {
        const normRole = normalizeRole(user.data.role);
        return allowedRoles.some((allowedRole) => {
          if (allowedRole === 'CEO') return normRole === UserRole.CEO;
          if (allowedRole === 'MANAGER') return normRole === UserRole.MANAGER;
          if (allowedRole === 'TL') return normRole === UserRole.TL;
          if (allowedRole === 'EMPLOYEE') return normRole === UserRole.EMPLOYEE;
          return false;
        });
      }

      return true;
    },
    [user.data],
  );

  return { checkAccess, role: user.data.role };
};

type AuthorizationProps = {
  forbiddenFallback?: React.ReactNode;
  children: React.ReactNode;
} & (
  | {
      allowedRoles: RoleTypes[];
      policyCheck?: never;
    }
  | {
      allowedRoles?: never;
      policyCheck: boolean;
    }
);

export const Authorization = ({
  policyCheck,
  allowedRoles,
  forbiddenFallback = null,
  children,
}: AuthorizationProps) => {
  const { checkAccess } = useAuthorization();

  let canAccess = false;

  if (allowedRoles) {
    canAccess = checkAccess({ allowedRoles });
  }

  if (typeof policyCheck !== 'undefined') {
    canAccess = policyCheck;
  }

  return <>{canAccess ? children : forbiddenFallback}</>;
};
