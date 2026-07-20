import { QueryClient } from '@tanstack/react-query';
import { LoaderFunctionArgs } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks';
import { TasksList } from '@/features/tasks/components/tasks-list';

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get('page') || 1);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') ? Number(url.searchParams.get('status')) : undefined;
    const priority = url.searchParams.get('priority') ? Number(url.searchParams.get('priority')) : undefined;

    const query = getTasksQueryOptions({ page, search, status, priority });

    try {
      return (
        queryClient.getQueryData(query.queryKey) ??
        (await queryClient.fetchQuery(query))
      );
    } catch (error) {
      console.error('Failed to prefetch tasks:', error);
      return null;
    }
  };

const TasksRoute = () => {
  return (
    <ContentLayout title="Tasks">
      <div className="mt-4 animate-in fade-in duration-300">
        <TasksList />
      </div>
    </ContentLayout>
  );
};

export default TasksRoute;
