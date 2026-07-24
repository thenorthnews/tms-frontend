import * as React from 'react';
import { useUser } from './auth';

export enum UserRole {
  CEO = 0,
  MANAGER = 1,
  TL = 2,
  EMPLOYEE = 4,
}

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
        const userRole = user.data.role;
        const numericRole = typeof userRole === 'string' ? parseInt(userRole, 10) : userRole;
        return allowedRoles.some(allowedRole => {
          if (allowedRole === 'CEO') {
            return numericRole === UserRole.CEO || userRole === 'CEO' || userRole === 0;
          }
          if (allowedRole === 'MANAGER') {
            return numericRole === UserRole.MANAGER || userRole === 'MANAGER' || userRole === 1;
          }
          if (allowedRole === 'TL') {
            return numericRole === UserRole.TL || userRole === 'TL' || userRole === 2;
          }
          if (allowedRole === 'EMPLOYEE') {
            return numericRole === UserRole.EMPLOYEE || userRole === 'EMPLOYEE' || userRole === 4;
          }
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
