import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api, mapUser } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Form, Input, Select, Textarea } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { createTaskInputSchema, useCreateTask } from '../api/create-task';
import { TaskStatus, TaskPriority } from '../types';

export const CreateTask = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // Fetch active users for the assignee dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { limit: 100 } }) as any;
      return (res.users || []).map(mapUser);
    },
  });

  const createTaskMutation = useCreateTask({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Task Created',
        });
        navigate(paths.app.tasks.getHref());
      },
    },
  });

  const userOptions = [
    { label: 'Unassigned', value: '' },
    ...users.map((u: any) => ({
      label: `${u.firstName} ${u.lastName} (${u.email})`,
      value: u.id,
    })),
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Create New Task</h3>
        <p className="text-sm text-slate-500">Fill in the details below to create and assign a new task.</p>
      </div>

      <Form
        id="create-task"
        onSubmit={(values) => {
          const data = {
            ...values,
            assignedTo: values.assignedTo || undefined,
            status: Number(values.status),
            priority: Number(values.priority),
          };
          createTaskMutation.mutate({ data });
        }}
        schema={createTaskInputSchema}
        options={{
          defaultValues: {
            title: '',
            description: '',
            status: TaskStatus.PENDING,
            priority: TaskPriority.LOW,
            dueDate: '',
            assignedTo: '',
          } as any,
        }}
      >
        {({ register, formState }) => (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200">
                <Input
                  label="Task Title"
                  error={formState.errors.title as any}
                  registration={register('title')}
                  placeholder="Enter a clear summary for this task..."
                />
                
                <div className="mt-4">
                  <Textarea
                    label="Description"
                    error={formState.errors.description as any}
                    registration={register('description')}
                    placeholder="Provide details or steps to complete the task..."
                    rows={6}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <Select
                  label="Status"
                  error={formState.errors.status as any}
                  registration={register('status')}
                  options={[
                    { label: 'Pending', value: String(TaskStatus.PENDING) },
                    { label: 'In Progress', value: String(TaskStatus.IN_PROGRESS) },
                    { label: 'Completed', value: String(TaskStatus.COMPLETED) },
                    { label: 'Cancelled', value: String(TaskStatus.CANCELLED) },
                  ]}
                />

                <Select
                  label="Priority"
                  error={formState.errors.priority as any}
                  registration={register('priority')}
                  options={[
                    { label: 'Low', value: String(TaskPriority.LOW) },
                    { label: 'Medium', value: String(TaskPriority.MEDIUM) },
                    { label: 'High', value: String(TaskPriority.HIGH) },
                  ]}
                />

                <Input
                  label="Due Date"
                  type="date"
                  error={formState.errors.dueDate as any}
                  registration={register('dueDate')}
                />

                <Select
                  label="Assign To"
                  error={formState.errors.assignedTo as any}
                  registration={register('assignedTo')}
                  options={userOptions}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => navigate(paths.app.tasks.getHref())}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full px-6"
                  isLoading={createTaskMutation.isPending}
                >
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};
