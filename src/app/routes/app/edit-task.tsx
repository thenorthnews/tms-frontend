import { QueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs, useParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { getTaskQueryOptions } from '@/features/tasks/api/get-task';
import { EditTask } from '@/features/tasks/components/edit-task';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const taskId = params.taskId;
    if (!taskId) return null;

    const query = getTaskQueryOptions(taskId);

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch (error) {
      console.error('Failed to prefetch task details:', error);
      return null;
    }
  };

const EditTaskRoute = () => {
  const { taskId } = useParams();

  if (!taskId) {
    return (
      <ContentLayout title="Edit Task">
        <div className="text-center text-red-500 py-8 font-semibold">
          No task ID provided.
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Edit Task">
      <div className="mt-4 animate-in fade-in duration-300">
        <EditTask taskId={taskId} />
      </div>
    </ContentLayout>
  );
};

export default EditTaskRoute;
