import { ContentLayout } from '@/components/layouts';
import { CreateTask } from '@/features/tasks/components/create-task';
import { Authorization, ROLES } from '@/lib/authorization';

const CreateTaskRoute = () => {
  return (
    <ContentLayout title="Create Task">
      <Authorization
        forbiddenFallback={
          <div>You do not have permission to create tasks.</div>
        }
        allowedRoles={[ROLES.CEO, ROLES.MANAGER, ROLES.TL]}
      >
        <div className="mt-4 duration-300 animate-in fade-in">
          <CreateTask />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default CreateTaskRoute;
