import { QueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { LoaderFunctionArgs, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { getUsersQueryOptions } from '@/features/users/api/get-users';
import { UsersList } from '@/features/users/components/users-list';
import { Authorization, ROLES } from '@/lib/authorization';
import { useUser } from '@/lib/auth';

export const clientLoader =
  (queryClient: QueryClient) =>
    async ({ request }: LoaderFunctionArgs) => {
      const url = new URL(request.url);

      const page = Number(url.searchParams.get('page') || 1);
      const search = url.searchParams.get('search') || '';

      const query = getUsersQueryOptions({ page, search });

      try {
        return (
          queryClient.getQueryData(query.queryKey) ??
          (await queryClient.fetchQuery(query))
        );
      } catch (error) {
        console.error('Failed to load users:', error);
        return null;
      }
    };

const UsersRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const isCEO = user.data?.role === 0 || user.data?.role === 'CEO';

  return (
    <ContentLayout title="Users">
      <Authorization
        forbiddenFallback={<div>Only CEO can view this.</div>}
        allowedRoles={[ROLES.CEO]}
      >
        {isCEO && (
          <div className="flex justify-end">
            <Button
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => navigate(paths.app.createUser.getHref())}
            >
              Create User
            </Button>
          </div>
        )}
        <div className="mt-4">
          <UsersList />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default UsersRoute;
