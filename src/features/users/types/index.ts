import { User } from '@/types/api';

import { CreateUserInput } from '../api/create-user';
import { UpdateUserInput } from '../api/update-user';

export { UserRole, UserStatus } from '@/utils/roles';
export {
  UserRole as UserRoleEnum,
  UserStatus as UserStatusEnum,
} from '@/utils/roles';

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
