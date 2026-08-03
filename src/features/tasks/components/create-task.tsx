import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import { api, mapUser } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { UserRole } from '@/lib/authorization';
import { Button } from '@/components/ui/button';
import { Form, Input, Select, Textarea } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { createTaskInputSchema, useCreateTask } from '../api/create-task';
import { TaskStatus, TaskPriority, Subtask } from '../types';
import { User, Team } from '@/types/api';

import { useClients } from '@/features/clients/api/get-clients';

export const CreateTask = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const currentUserQuery = useUser();
  const currentUser = currentUserQuery.data;

  // Use enum instead of magic number
  if (currentUser?.role === UserRole.EMPLOYEE) {
    return <Navigate to={paths.app.tasks.getHref()} replace />;
  }

  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean; status?: number; assignedTo?: string; dueDate?: string }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Fetch active users for the assignee dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = (await api.get('/admin/users', {
        params: { limit: 100 },
      })) as { users?: Record<string, any>[] };
      return (res.users || []).map(mapUser);
    },
  });

  // Fetch teams for filtering assignees for Manager/TL
  const { data: teamsRes = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return (Array.isArray(res) ? res : (res as { data?: Team[] })?.data || []) as Team[];
    },
  });

  const canSelectClient =
    currentUser?.role === UserRole.CEO ||
    currentUser?.role === UserRole.MANAGER ||
    currentUser?.role === UserRole.TL ||
    currentUser?.role === 0 ||
    currentUser?.role === 1 ||
    currentUser?.role === 2 ||
    currentUser?.role === 'CEO' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'TL';

  // Fetch clients for the client dropdown if user is CEO, Manager, or TL
  const { data: clientsRes = [], isLoading: isLoadingClients } = useClients({
    queryConfig: { enabled: canSelectClient },
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

  const clientOptions = [
    { label: 'Select Client *', value: '' },
    ...clientsRes.map((c) => ({
      label: `${c.name}${c.companyName ? ` (${c.companyName})` : ''}`,
      value: (c._id || c.id) as string,
    })),
  ];

  // Loading skeleton for dropdown areas
  const isLoadingDropdowns = isLoadingUsers || isLoadingTeams || isLoadingClients;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Breadcrumb row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
          <button
            onClick={() => navigate(paths.app.tasks.getHref())}
            className="hover:text-[#1E3A8A] transition-colors"
          >
            Tasks
          </button>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-700">Create Task</span>
        </div>

        <button
          onClick={() => navigate(paths.app.tasks.getHref())}
          className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-[#0EA5E9] transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Back to list
        </button>
      </div>
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 animate-card-enter">
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Create New Task
        </h3>
        <p className="text-sm text-slate-500">
          Fill in the details below to create and assign a new task.
        </p>
      </div>

      <Form
        id="create-task"
        onSubmit={(values) => {
          const data = {
            ...values,
            assignedTo: selectedAssignees.length > 0 ? selectedAssignees : undefined,
            clientId: values.clientId || undefined,
            status: Number(values.status),
            priority: Number(values.priority),
            subtasks,
          };
          delete (data as Record<string, unknown>).teamId;
          delete (data as Record<string, unknown>).teamIds;
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
            clientId: '',
          },
        }}
      >
        {({ register, formState }) => {
          // Extract team members and manager IDs if user is Manager/TL
          const teamMemberIds = new Set<string>();
          if (currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.TL) {
            // Find all teams managed by currentUser
            const managedTeams = teamsRes.filter((t: Team) => {
              const mgr = t.managerId;
              const mgrId = (
                typeof mgr === 'object' ? mgr?._id || mgr?.id : mgr
              )?.toString();
              return mgrId === currentUser.id?.toString();
            });
            managedTeams.forEach((t: Team) => {
              const mgr = t.managerId;
              const mgrId = (
                typeof mgr === 'object' ? mgr?._id || mgr?.id : mgr
              )?.toString();
              if (mgrId) teamMemberIds.add(mgrId);
              (t.members || []).forEach((m: unknown) => {
                const mb = m as { _id?: string; id?: string } | string;
                const mId = (typeof mb === 'object' ? mb._id || mb.id : mb)?.toString();
                if (mId) teamMemberIds.add(mId);
              });
            });
            if (currentUser.id) teamMemberIds.add(currentUser.id.toString());
          }

          const filteredUsers =
            currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.TL
              ? users.filter((u: User) =>
                teamMemberIds.has(String(u.id || u._id)),
              )
              : users;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 animate-card-enter">
                  <Input
                    label="Task Title"
                    error={formState.errors.title}
                    registration={register('title')}
                    placeholder="Enter a clear summary for this task..."
                  />

                  <div className="mt-4">
                    <Textarea
                      label="Description"
                      error={formState.errors.description}
                      registration={register('description')}
                      placeholder="Provide details or steps to complete the task..."
                      rows={6}
                    />
                  </div>
                </div>

                {/* Subtasks Checklist Section */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-card-enter">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Initial Subtasks Checklist
                    </label>

                    {subtasks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {subtasks.map((sub, idx) => {
                          const assignedUser = users.find((u: User) => (u.id || u._id) === sub.assignedTo);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-800">
                                  {sub.title}
                                </span>
                                {assignedUser && (
                                  <span className="bg-sky-50 text-[#0EA5E9] border border-sky-100 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                    Assigned: {assignedUser.firstName} {assignedUser.lastName}
                                  </span>
                                )}
                                {sub.dueDate && (
                                  <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                    Due: {sub.dueDate}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSubtasks(
                                    subtasks.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  )
                                }
                                className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <input
                        type="text"
                        placeholder="Add step/subtask item..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSubtaskTitle.trim()) {
                              setSubtasks([
                                ...subtasks,
                                {
                                  title: newSubtaskTitle.trim(),
                                  isCompleted: false,
                                  assignedTo: newSubtaskAssignee || undefined,
                                  dueDate: newSubtaskDueDate || undefined,
                                },
                              ]);
                              setNewSubtaskTitle('');
                              setNewSubtaskAssignee('');
                              setNewSubtaskDueDate('');
                            }
                          }
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-700 transition-all"
                      />
                      <div className="flex gap-2 flex-wrap items-center">
                        <select
                          value={newSubtaskAssignee}
                          onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1E3A8A]"
                        >
                          <option value="">Assign Subtask User (Optional)</option>
                          {filteredUsers.map((u: User) => (
                            <option key={u.id || u._id} value={u.id || u._id}>
                              {u.firstName} {u.lastName} ({u.role === 4 ? 'Employee' : u.role === 1 ? 'Manager' : u.role === 2 ? 'TL' : 'CEO'})
                            </option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={newSubtaskDueDate}
                          onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1E3A8A]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newSubtaskTitle.trim()) {
                              setSubtasks([
                                ...subtasks,
                                {
                                  title: newSubtaskTitle.trim(),
                                  isCompleted: false,
                                  assignedTo: newSubtaskAssignee || undefined,
                                  dueDate: newSubtaskDueDate || undefined,
                                },
                              ]);
                              setNewSubtaskTitle('');
                              setNewSubtaskAssignee('');
                              setNewSubtaskDueDate('');
                            }
                          }}
                          className="px-4 py-1.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-lg cursor-pointer ml-auto"
                        >
                          + Add Subtask
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 animate-card-enter">
                  {isLoadingDropdowns ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 w-20 bg-slate-200 rounded animate-skeleton" />
                          <div className="h-11 w-full bg-slate-100 rounded-full animate-skeleton" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Select
                        label="Status"
                        error={formState.errors.status}
                        registration={register('status')}
                        options={[
                          { label: 'Pending', value: String(TaskStatus.PENDING) },
                          {
                            label: 'In Progress',
                            value: String(TaskStatus.IN_PROGRESS),
                          },
                          {
                            label: 'Hold',
                            value: String(TaskStatus.ON_HOLD),
                          },
                          {
                            label: 'Completed',
                            value: String(TaskStatus.COMPLETED),
                          },
                          {
                            label: 'Cancelled',
                            value: String(TaskStatus.CANCELLED),
                          },
                        ]}
                      />

                      <Select
                        label="Priority"
                        error={formState.errors.priority}
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
                        min={new Date().toISOString().split('T')[0]}
                        error={formState.errors.dueDate}
                        registration={register('dueDate')}
                      />

                      {canSelectClient && (
                        <Select
                          label="Client *"
                          error={formState.errors.clientId}
                          registration={register('clientId')}
                          options={clientOptions}
                        />
                      )}

                      {/* Multi-Assignee Selection */}
                      <div className="space-y-2 text-left">
                        <label className="block text-xs font-bold text-slate-700">
                          Assign To (Select Multiple Users)
                        </label>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
                          {/* Selected Assignees Badges */}
                          <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                            {selectedAssignees.length === 0 ? (
                              <span className="text-slate-400 text-xs italic">No users selected (Unassigned)</span>
                            ) : (
                              selectedAssignees.map((id) => {
                                const u = users.find((user: User) => (user.id || user._id) === id);
                                if (!u) return null;

                                const handleRemove = () => {
                                  setSelectedAssignees(selectedAssignees.filter((aId) => aId !== id));
                                };

                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 bg-[#1E3A8A] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs"
                                  >
                                    {u.firstName} {u.lastName}
                                    <button
                                      type="button"
                                      onClick={handleRemove}
                                      className="hover:text-rose-300 ml-1 cursor-pointer"
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </span>
                                );
                              })
                            )}
                          </div>

                          {/* Checkbox List */}
                          <div className="max-h-48 overflow-y-auto border-t border-slate-200 pt-2 space-y-1">
                            {filteredUsers.length === 0 ? (
                              <span className="text-slate-400 text-xs italic block p-1">No assignees available</span>
                            ) : (
                              filteredUsers.map((u: User) => {
                                const uId = u.id || u._id || '';
                                const isSelected = selectedAssignees.includes(uId);
                                const roleBadge = u.role === 0 ? 'CEO' : u.role === 1 ? 'Manager' : u.role === 2 ? 'TL' : 'Employee';

                                const handleAssigneeChange = (checked: boolean) => {
                                  const newList = checked
                                    ? [...selectedAssignees, uId]
                                    : selectedAssignees.filter((id) => id !== uId);
                                  setSelectedAssignees(newList);
                                };

                                return (
                                  <label
                                    key={uId}
                                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                      isSelected ? 'bg-indigo-50/80 border border-indigo-200 text-[#1E3A8A]' : 'hover:bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleAssigneeChange(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>{u.firstName} {u.lastName} <span className="text-slate-400 font-normal">({u.email})</span></span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                                      u.role === 1 ? 'bg-purple-100 text-purple-700' : u.role === 2 ? 'bg-blue-100 text-blue-700' : u.role === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {roleBadge}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
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
          );
        }}
      </Form>
    </div>
  );
};
