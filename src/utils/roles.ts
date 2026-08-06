export enum UserRole {
  CEO = 0,
  MANAGER = 1,
  TL = 2,
  EMPLOYEE = 4,
}

export enum UserStatus {
  ACTIVE = 0,
  INACTIVE = 1,
  PENDING = 2,
  SUSPENDED = 3,
}

export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2,
}

export enum TaskStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  ON_HOLD = 4,
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export const normalizeRole = (
  role: number | string | undefined | null,
): UserRole => {
  if (role === undefined || role === null) return UserRole.EMPLOYEE;
  if (typeof role === 'number') {
    if (role === 0) return UserRole.CEO;
    if (role === 1) return UserRole.MANAGER;
    if (role === 2) return UserRole.TL;
    return UserRole.EMPLOYEE;
  }
  const str = String(role).toUpperCase().trim();
  if (str === 'CEO' || str === '0') return UserRole.CEO;
  if (str === 'MANAGER' || str === '1') return UserRole.MANAGER;
  if (str === 'TL' || str === 'TEAM LEAD' || str === 'TEAMLEAD' || str === '2')
    return UserRole.TL;
  return UserRole.EMPLOYEE;
};

export const isCEO = (role: number | string | undefined | null): boolean => {
  return normalizeRole(role) === UserRole.CEO;
};

export const isManager = (
  role: number | string | undefined | null,
): boolean => {
  return normalizeRole(role) === UserRole.MANAGER;
};

export const isTL = (role: number | string | undefined | null): boolean => {
  return normalizeRole(role) === UserRole.TL;
};

export const isEmployee = (
  role: number | string | undefined | null,
): boolean => {
  return normalizeRole(role) === UserRole.EMPLOYEE;
};

export const isManagerOrAbove = (
  role: number | string | undefined | null,
): boolean => {
  const norm = normalizeRole(role);
  return norm === UserRole.CEO || norm === UserRole.MANAGER || norm === UserRole.TL;
};

export const getRoleLabel = (
  role: number | string | undefined | null,
): string => {
  const norm = normalizeRole(role);
  switch (norm) {
    case UserRole.CEO:
      return 'CEO';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.TL:
      return 'Team Lead';
    case UserRole.EMPLOYEE:
    default:
      return 'Employee';
  }
};

export const getRoleBadgeStyle = (
  role: number | string | undefined | null,
): string => {
  const norm = normalizeRole(role);
  switch (norm) {
    case UserRole.CEO:
      return 'bg-[#1E3A8A]/10 text-[#1E3A8A]';
    case UserRole.MANAGER:
    case UserRole.TL:
      return 'bg-[#0EA5E9]/10 text-[#0EA5E9]';
    case UserRole.EMPLOYEE:
    default:
      return 'bg-emerald-50/15 text-emerald-600';
  }
};
