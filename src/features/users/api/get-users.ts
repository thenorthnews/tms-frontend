import { queryOptions, useQuery } from '@tanstack/react-query';

import { api, mapUser } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { User } from '@/types/api';

export const getUsers = async (
  page = 1,
  search = '',
  limit?: number,
  role?: number,
  teamId?: string,
): Promise<{
  data: User[];
  meta: {
    totalPages: number;
    page: number;
    limit: number;
    total: number;
  };
}> => {
  const response: {
    users?: Record<string, unknown>[];
    total?: number;
    limit?: number;
    page?: number;
  } = await api.get(`/admin/users`, {
    params: {
      page,
      search,
      limit,
      role,
      teamId,
    },
  });
  const users = (response.users || []).map(mapUser);
  const total = response.total || 0;
  const limitVal = response.limit || 10;
  const totalPages = Math.ceil(total / limitVal);

  return {
    data: users,
    meta: {
      totalPages,
      page: response.page || page,
      limit: limitVal,
      total,
    },
  };
};

export const getUsersQueryOptions = ({
  page,
  search,
  limit,
  role,
  teamId,
}: {
  page?: number;
  search?: string;
  limit?: number;
  role?: number;
  teamId?: string;
} = {}) => {
  return queryOptions({
    queryKey: ['users', { page, search, limit, role, teamId }],
    queryFn: () => getUsers(page, search, limit, role, teamId),
  });
};

type UseUsersOptions = {
  page?: number;
  search?: string;
  limit?: number;
  role?: number;
  teamId?: string;
  queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
};

export const useUsers = ({
  page,
  search,
  limit,
  role,
  teamId,
  queryConfig,
}: UseUsersOptions = {}) => {
  return useQuery({
    ...getUsersQueryOptions({ page, search, limit, role, teamId }),
    ...queryConfig,
  });
};
