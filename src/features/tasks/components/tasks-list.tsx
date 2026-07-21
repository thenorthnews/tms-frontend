import { Edit2, MoreVertical, Trash2, Plus, Calendar, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableColumn } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { formatDate } from '@/utils/format';

import { useTasks } from '../api/get-tasks';
import { useUpdateTask } from '../api/update-task';
import { useDeleteTask } from '../api/delete-task';
import { TaskStatus, TaskPriority, Task } from '../types';

export const TasksList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = +(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status');
  const priorityFilter = searchParams.get('priority');

  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(statusFilter || '');
  const [priorityVal, setPriorityVal] = useState(priorityFilter || '');

  const updateTaskMutation = useUpdateTask({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Task updated successfully',
        });
      },
    },
  });

  const deleteTaskMutation = useDeleteTask({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Task deleted successfully',
        });
      },
    },
  });

  // Sync state with URL search param
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchVal) {
          next.set('search', searchVal);
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchVal, setSearchParams]);

  const handleStatusFilterChange = (val: string) => {
    setStatusVal(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('status', val);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePriorityFilterChange = (val: string) => {
    setPriorityVal(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('priority', val);
      } else {
        next.delete('priority');
      }
      next.set('page', '1');
      return next;
    });
  };

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page, search };
    if (statusVal) params.status = Number(statusVal);
    if (priorityVal) params.priority = Number(priorityVal);
    return params;
  }, [page, search, statusVal, priorityVal]);

  const tasksQuery = useTasks({ params: queryParams });

  if (tasksQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="flex h-48 w-full items-center justify-center text-red-500 gap-2">
        <AlertCircle className="size-5" />
        Failed to load tasks.
      </div>
    );
  }

  const tasks = tasksQuery.data?.data;
  const total = tasksQuery.data?.total || 0;
  const limit = tasksQuery.data?.limit || 10;
  const totalPages = Math.ceil(total / limit) || 1;

  const columns: TableColumn<Task>[] = [
    {
      title: 'Title',
      field: 'title',
      Cell({ entry: { title, description } }: any) {
        return (
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block">{title}</span>
            {description && (
              <span className="text-xs text-slate-400 font-medium block max-w-xs truncate">
                {description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Assignee',
      field: 'assignedTo',
      Cell({ entry: { assigneeInfo } }: any) {
        if (!assigneeInfo) {
          return <span className="text-slate-400 text-sm font-medium">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            {assigneeInfo.image ? (
              <img
                className="h-7 w-7 rounded-full object-cover border border-slate-200"
                src={assigneeInfo.image}
                alt="Assignee"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                <span className="text-slate-400 text-[10px] font-semibold">
                  {assigneeInfo.firstName?.[0] || 'U'}
                </span>
              </div>
            )}
            <span className="font-semibold text-slate-700 text-sm">
              {`${assigneeInfo.firstName} ${assigneeInfo.lastName}`}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Priority',
      field: 'priority',
      Cell({ entry: { priority } }: any) {
        const getPriorityBadge = (p: number) => {
          switch (p) {
            case TaskPriority.HIGH:
              return 'bg-red-50 text-red-700 border-red-200';
            case TaskPriority.MEDIUM:
              return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
              return 'bg-blue-50 text-blue-700 border-blue-200';
          }
        };

        const getPriorityLabel = (p: number) => {
          switch (p) {
            case TaskPriority.HIGH: return 'High';
            case TaskPriority.MEDIUM: return 'Medium';
            default: return 'Low';
          }
        };

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadge(priority)}`}>
            {getPriorityLabel(priority)}
          </span>
        );
      },
    },
    {
      title: 'Status',
      field: 'status',
      Cell({ entry: { id, _id, status } }: any) {
        const taskId = id || _id;
        const getStatusColor = (s: number) => {
          switch (s) {
            case TaskStatus.COMPLETED:
              return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20';
            case TaskStatus.IN_PROGRESS:
              return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20';
            case TaskStatus.CANCELLED:
              return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20';
            default:
              return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500/20';
          }
        };

        return (
          <select
            className={`block w-32 rounded-full border px-3 py-1.5 shadow-sm text-xs font-semibold focus:ring-4 transition-all cursor-pointer ${getStatusColor(status as number)}`}
            value={status}
            onChange={(e) => {
              updateTaskMutation.mutate({
                taskId,
                data: { status: Number(e.target.value) },
              });
            }}
            disabled={updateTaskMutation.isPending}
          >
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.CANCELLED}>Cancelled</option>
          </select>
        );
      },
    },
    {
      title: 'Due Date',
      field: 'dueDate',
      Cell({ entry: { dueDate } }: any) {
        if (!dueDate) return <span className="text-slate-400 text-xs font-medium">No due date</span>;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Calendar className="size-3.5 text-slate-400" />
            {formatDate(new Date(dueDate).getTime())}
          </div>
        );
      },
    },
    {
      title: '',
      field: 'id',
      Cell({ entry: { id, _id } }: any) {
        const taskId = id || _id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-200">
              <MoreVertical className="size-5 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="cursor-pointer font-semibold"
                onClick={() => navigate(paths.app.editTask.getHref(taskId))}
              >
                <Edit2 className="mr-2 size-4" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 font-semibold"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    deleteTaskMutation.mutate({ taskId });
                  }
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const pagination = {
    totalPages,
    currentPage: page,
    rootUrl: '',
  };

  return (
    <div className="space-y-6">
      {/* Header section with search & creation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white/70 backdrop-blur-md border border-slate-100 p-4 rounded-3xl shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full rounded-full px-5 py-2 border border-slate-200 bg-white shadow-inner focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
            value={statusVal}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
            value={priorityVal}
            onChange={(e) => handlePriorityFilterChange(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value={TaskPriority.LOW}>Low Priority</option>
            <option value={TaskPriority.MEDIUM}>Medium Priority</option>
            <option value={TaskPriority.HIGH}>High Priority</option>
          </select>
        </div>

        <Button
          onClick={() => navigate(paths.app.createTask.getHref())}
          icon={<Plus className="size-4" />}
          className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/15 border-0 cursor-pointer transition-all shrink-0 h-10 px-6"
        >
          Create Task
        </Button>
      </div>

      {tasksQuery.isFetching && !tasksQuery.isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-8 text-slate-500 shadow-sm animate-in fade-in duration-500">
          <div className="rounded-full bg-slate-50 p-4 mb-4 border border-slate-100">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-700">No tasks found</span>
          <p className="text-sm text-slate-400 mt-1 font-medium">Create a new task to get started or adjust your filters.</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <Table data={tasks} columns={columns} pagination={pagination} />
        </div>
      )}
    </div>
  );
};
