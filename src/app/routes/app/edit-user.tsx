import { QueryClient } from '@tanstack/react-query';
import { useParams, LoaderFunctionArgs } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { getUserQueryOptions } from '@/features/users/api/get-user';
import { EditUserForm } from '@/features/users/components/edit-user';
import { Authorization, ROLES } from '@/lib/authorization';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const userId = params.userId as string;

    const query = getUserQueryOptions(userId);

    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    );
  };

const EditUserRoute = () => {
  const params = useParams();
  const userId = params.userId as string;

  return (
    <ContentLayout title="Edit User">
      <Authorization
        forbiddenFallback={<div>Only CEO can view this.</div>}
        allowedRoles={[ROLES.CEO]}
      >
        <div className="mx-auto max-w-6xl">
          <EditUserForm userId={userId} />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default EditUserRoute;
