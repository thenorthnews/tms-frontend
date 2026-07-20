import { ContentLayout } from '@/components/layouts';
import { CreateTask } from '@/features/tasks/components/create-task';

const CreateTaskRoute = () => {
  return (
    <ContentLayout title="Create Task">
      <div className="mt-4 animate-in fade-in duration-300">
        <CreateTask />
      </div>
    </ContentLayout>
  );
};

export default CreateTaskRoute;
