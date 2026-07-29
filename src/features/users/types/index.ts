import { User } from '@/types/api';
import { CreateUserInput } from '../api/create-user';
import { UpdateUserInput } from '../api/update-user';

export type UserRole = 0 | 1 | 2 | 4;

export enum UserRoleEnum {
  CEO = 0,
  MANAGER = 1,
  TL = 2,
  EMPLOYEE = 4,
}

export enum UserStatusEnum {
  ACTIVE = 0,
  INACTIVE = 1,
  PENDING = 2,
}

export type { CreateUserInput, UpdateUserInput };

export type GetUsersResponse = {
  data: User[];
  meta: {
    totalPages: number;
    page: number;
    limit: number;
    total: number;
  };
};

export type UpdateUserStatusInput = {
  userId: string;
  status: number;
};
