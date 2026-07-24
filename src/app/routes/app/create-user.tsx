import { ContentLayout } from '@/components/layouts';
import { CreateUserForm } from '@/features/users/components/create-user';
import { Authorization, ROLES } from '@/lib/authorization';

const CreateUserRoute = () => {
  return (
    <ContentLayout title="Create User">
      <Authorization
        forbiddenFallback={<div>Only CEO can view this.</div>}
        allowedRoles={[ROLES.CEO]}
      >
        <div className="mx-auto max-w-6xl">
          <CreateUserForm />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default CreateUserRoute;
