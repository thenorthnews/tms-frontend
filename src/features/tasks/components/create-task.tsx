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

  // Local state for tags and subtasks
  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [autoTeamIds, setAutoTeamIds] = useState<string[]>([]);

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

  // Fetch teams for the team dropdown
  const { data: teamsRes = [], isLoading: isLoadingTeams } = useQuery<any[]>({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const res = (await api.get('/admin/teams')) as any;
      return (res.data || res || []) as any[];
    },
  });

  const isCEO = currentUser?.role === UserRole.CEO || currentUser?.role === 0 || currentUser?.role === 'CEO';

  // Fetch clients for the client dropdown only if user is CEO
  const { data: clientsRes = [], isLoading: isLoadingClients } = useClients({
    queryConfig: { enabled: isCEO },
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

  const teamOptions = [
    { label: 'No Team (Independent)', value: '' },
    ...teamsRes.map((t: Team) => ({
      label: t.name,
      value: (t._id || t.id) as string,
    })),
  ];

  const clientOptions = [
    { label: 'Select Client *', value: '' },
    ...clientsRes.map((c: any) => ({
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
          const parsedTags = tagsInput
            .split(',')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0);

          const data = {
            ...values,
            assignedTo: selectedAssignees.length > 0 ? selectedAssignees : undefined,
            teamIds: autoTeamIds.length > 0 ? autoTeamIds : undefined,
            clientId: values.clientId,
            status: Number(values.status),
            priority: Number(values.priority),
            subtasks,
            tags: parsedTags,
          };
          delete (data as any).teamId;
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
            teamId: '',
            clientId: '',
          } as any,
        }}
      >
        {({ register, formState, watch, setValue }) => {
          const selectedTeamId = watch('teamId');
          const selectedTeam = teamsRes.find(
            (t: any) => (t._id || t.id) === selectedTeamId,
          );

          // Extract team members and manager IDs if a team is selected or user is Manager/TL
          const teamMemberIds = new Set<string>();
          if (selectedTeam) {
            if (selectedTeam.managerId) {
              const mgrId =
                typeof selectedTeam.managerId === 'object'
                  ? selectedTeam.managerId._id || selectedTeam.managerId.id
                  : selectedTeam.managerId;
              if (mgrId) teamMemberIds.add(String(mgrId));
            }
            if (Array.isArray(selectedTeam.members)) {
              selectedTeam.members.forEach((m: any) => {
                const mId = typeof m === 'object' ? m._id || m.id : m;
                if (mId) teamMemberIds.add(String(mId));
              });
            }
          } else if (currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.TL) {
            // Find all teams managed by currentUser
            const managedTeams = teamsRes.filter((t: any) => {
              const mgrId = (
                t.managerId?._id ||
                t.managerId?.id ||
                t.managerId
              )?.toString();
              return mgrId === currentUser.id?.toString();
            });
            managedTeams.forEach((t: any) => {
              const mgrId = (
                t.managerId?._id ||
                t.managerId?.id ||
                t.managerId
              )?.toString();
              if (mgrId) teamMemberIds.add(mgrId);
              (t.members || []).forEach((m: any) => {
                const mId = (m._id || m.id || m)?.toString();
                if (mId) teamMemberIds.add(mId);
              });
            });
            if (currentUser.id) teamMemberIds.add(currentUser.id.toString());
          }

          const filteredUsers =
            selectedTeamId || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.TL
              ? users.filter((u: any) =>
                teamMemberIds.has(String(u.id || u._id)),
              )
              : users;

          const userOptions = [
            {
              label: 'Unassigned',
              value: '',
            },
            ...filteredUsers.map((u: any) => ({
              label: `${u.firstName} ${u.lastName} (${u.email})`,
              value: u.id || u._id,
            })),
          ];

          const teamRegister = register('teamId');

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 animate-card-enter">
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

                {/* Tags and Subtasks Checklist Section */}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-card-enter">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Tags / Labels
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bug, Feature, Design (comma separated)"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 transition-all"
                    />
                    {tagsInput && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tagsInput.split(',').map((tag, i) => {
                          const trimmed = tag.trim();
                          if (!trimmed) return null;
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150"
                            >
                              {trimmed}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Initial Subtasks Checklist
                    </label>

                    {subtasks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {subtasks.map((sub: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100"
                          >
                            <span className="text-sm font-semibold text-slate-700">
                              {sub.title}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSubtasks(
                                  subtasks.filter(
                                    (_: any, i: number) => i !== idx,
                                  ),
                                )
                              }
                              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
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
                                },
                              ]);
                              setNewSubtaskTitle('');
                            }
                          }
                        }}
                        className="flex-1 text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 transition-all"
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
                              },
                            ]);
                            setNewSubtaskTitle('');
                          }
                        }}
                        className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Add
                      </button>
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
                        error={formState.errors.status as any}
                        registration={register('status')}
                        options={[
                          { label: 'Pending', value: String(TaskStatus.PENDING) },
                          {
                            label: 'In Progress',
                            value: String(TaskStatus.IN_PROGRESS),
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
                        min={new Date().toISOString().split('T')[0]}
                        error={formState.errors.dueDate as any}
                        registration={register('dueDate')}
                      />

                      {isCEO && (
                        <Select
                          label="Client *"
                          error={formState.errors.clientId as any}
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
                                const u = users.find((user: any) => (user.id || user._id) === id);
                                if (!u) return null;

                                const computeTeamIds = (list: string[]): string[] => {
                                  const found: string[] = [];
                                  for (const uid of list) {
                                    for (const t of teamsRes) {
                                      const tid = (t._id || t.id) as string;
                                      const members: string[] = (t.members || []).map((m: any) =>
                                        (typeof m === 'object' ? m._id || m.id : m)?.toString()
                                      );
                                      const mgrId = (typeof t.managerId === 'object'
                                        ? t.managerId?._id || t.managerId?.id
                                        : t.managerId)?.toString();
                                      if (members.includes(uid) || mgrId === uid) {
                                        if (!found.includes(tid)) found.push(tid);
                                      }
                                    }
                                  }
                                  return found;
                                };

                                const handleRemove = () => {
                                  const newList = selectedAssignees.filter((aId) => aId !== id);
                                  setSelectedAssignees(newList);
                                  setAutoTeamIds(computeTeamIds(newList));
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
                              filteredUsers.map((u: any) => {
                                const uId = u.id || u._id;
                                const isSelected = selectedAssignees.includes(uId);
                                const roleBadge = u.role === 0 ? 'CEO' : u.role === 1 ? 'Manager' : u.role === 2 ? 'TL' : 'Employee';

                                const computeTeamIds = (list: string[]): string[] => {
                                  const found: string[] = [];
                                  for (const uid of list) {
                                    for (const t of teamsRes) {
                                      const tid = (t._id || t.id) as string;
                                      const members: string[] = (t.members || []).map((m: any) =>
                                        (typeof m === 'object' ? m._id || m.id : m)?.toString()
                                      );
                                      const mgrId = (typeof t.managerId === 'object'
                                        ? t.managerId?._id || t.managerId?.id
                                        : t.managerId)?.toString();
                                      if (members.includes(uid) || mgrId === uid) {
                                        if (!found.includes(tid)) found.push(tid);
                                      }
                                    }
                                  }
                                  return found;
                                };

                                const handleAssigneeChange = (checked: boolean) => {
                                  const newList = checked
                                    ? [...selectedAssignees, uId]
                                    : selectedAssignees.filter((id) => id !== uId);
                                  setSelectedAssignees(newList);
                                  setAutoTeamIds(computeTeamIds(newList));
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

                      {/* Auto-detected Teams (read-only) */}
                      {autoTeamIds.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Team (Auto-detected)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {autoTeamIds.map((tid) => {
                              const team = teamsRes.find((t: any) => (t._id || t.id) === tid);
                              if (!team) return null;
                              return (
                                <span key={tid} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  {team.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
