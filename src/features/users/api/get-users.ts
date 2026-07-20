import { queryOptions, useQuery } from '@tanstack/react-query';

import { api, mapUser } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { User } from '@/types/api';

export const getUsers = async (
  page = 1,
  search = '',
): Promise<{
  data: User[];
  meta: {
    totalPages: number;
    page: number;
    limit: number;
    total: number;
  };
}> => {
  const response = (await api.get(`/admin/users`, {
    params: {
      page,
      search,
    },
  })) as any;
  const users = (response.users || []).map(mapUser);
  const total = response.total || 0;
  const limit = response.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
    meta: {
      totalPages,
      page: response.page || page,
      limit,
      total,
    },
  };
};

export const getUsersQueryOptions = ({
  page,
  search,
}: { page?: number; search?: string } = {}) => {
  return queryOptions({
    queryKey: ['users', { page, search }],
    queryFn: () => getUsers(page, search),
  });
};

type UseUsersOptions = {
  page?: number;
  search?: string;
  queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
};

export const useUsers = ({ page, search, queryConfig }: UseUsersOptions = {}) => {
  return useQuery({
    ...getUsersQueryOptions({ page, search }),
    ...queryConfig,
  });
};
