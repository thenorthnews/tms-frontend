import {
  Edit2,
  MoreVertical,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  AlertCircle,
  List,
  Columns,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Briefcase,
  X,
  ArrowRight,
  RotateCcw,
  Building,
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableColumn } from '@/components/ui/table';
import { paths } from '@/config/paths';
import { useClients } from '@/features/clients/api/get-clients';
import { useUsers } from '@/features/users/api/get-users';
import { useUser } from '@/lib/auth';
import { User } from '@/types/api';
import { formatDate } from '@/utils/format';

import { useDeleteTask } from '../api/delete-task';
import { useTasks } from '../api/get-tasks';
import { useUpdateTask } from '../api/update-task';
import { TaskStatus, TaskPriority, Task } from '../types';
import {
  getPriorityLabel,
  getPriorityBadgeStyle,
  getPriorityKanbanStyle,
  getPriorityDotColor,
  getStatusSelectStyle,
  getStatusLabel,
} from '../utils/task-utils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const TasksList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const currentUserQuery = useUser();
  const currentUser = currentUserQuery.data;
  const isEmployee =
    currentUser?.role === 4 || currentUser?.role === 'Employee';
  const isCEO = currentUser?.role === 0 || currentUser?.role === 'CEO';

  const [searchParams, setSearchParams] = useSearchParams();

  const page = +(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status');
  const priorityFilter = searchParams.get('priority');
  const dateFilterParam = searchParams.get('dateFilter');
  const clientFilterParam = searchParams.get('clientId');
  const assigneeFilterParam = searchParams.get('assignedTo');
  const currentView = searchParams.get('view') || 'list';

  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(statusFilter || '');
  const [priorityVal, setPriorityVal] = useState(priorityFilter || '');
  const [clientVal, setClientVal] = useState(clientFilterParam || '');
  const [assigneeVal, setAssigneeVal] = useState(assigneeFilterParam || '');
  const [dateVal, setDateVal] = useState(
    dateFilterParam || (currentView === 'kanban' ? 'today' : ''),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);

  const { data: clients = [] } = useClients({
    queryConfig: { enabled: isCEO },
  });

  const { data: usersData } = useUsers({
    limit: 1000,
    queryConfig: { enabled: !isEmployee },
  });
  const usersList = usersData?.data || [];

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

  // Sync state with URL search param only when user types in search
  useEffect(() => {
    const currentSearchInUrl = searchParams.get('search') || '';
    if (searchVal === currentSearchInUrl) return;

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
  }, [searchVal, searchParams, setSearchParams]);

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

  const handleClientFilterChange = (val: string) => {
    setClientVal(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('clientId', val);
      } else {
        next.delete('clientId');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleAssigneeFilterChange = (val: string) => {
    setAssigneeVal(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('assignedTo', val);
      } else {
        next.delete('assignedTo');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleDateFilterChange = (val: string) => {
    setDateVal(val);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'all') {
        next.set('dateFilter', val);
      } else {
        next.delete('dateFilter');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleViewChange = (view: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      next.set('page', '1');
      return next;
    });
  };

  const queryParams = useMemo(() => {
    const params: Record<string, any> = { search };
    if (statusVal) params.status = Number(statusVal);
    if (priorityVal) params.priority = Number(priorityVal);
    if (clientVal && clientVal !== 'all') params.clientId = clientVal;
    if (assigneeVal && assigneeVal !== 'all') params.assignedTo = assigneeVal;

    if (currentView === 'kanban') {
      params.limit = 100;
      params.page = 1;
      params.dateFilter = dateVal || 'today';
    } else if (currentView === 'calendar') {
      params.limit = 300;
      params.page = 1;
      const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else {
      params.limit = 10;
      params.page = page;
      if (dateVal && dateVal !== 'all') {
        params.dateFilter = dateVal;
      }
    }
    return params;
  }, [
    page,
    search,
    statusVal,
    priorityVal,
    clientVal,
    assigneeVal,
    currentView,
    dateVal,
    currentMonth,
    currentYear,
  ]);

  const selectedClient = useMemo(() => {
    if (!clientVal || clientVal === 'all') return null;
    return clients.find((c) => (c._id || c.id) === clientVal);
  }, [clients, clientVal]);

  const tasksQuery = useTasks({
    params: queryParams,
    queryConfig: {
      enabled: !isCEO || Boolean(clientVal) || Boolean(assigneeVal),
    },
  });

  if (tasksQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="flex h-48 w-full items-center justify-center gap-2 text-red-500">
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
      Cell({ entry: { title, description } }: { entry: Task }) {
        return (
          <div className="space-y-1">
            <span className="block font-bold text-slate-800">{title}</span>
            {description && (
              <span className="block max-w-xs truncate text-xs font-medium text-slate-400">
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
      Cell({ entry: { assigneeInfo } }: { entry: Task }) {
        if (!assigneeInfo) {
          return (
            <span className="text-sm font-medium text-slate-400">
              Unassigned
            </span>
          );
        }
        const assignees = Array.isArray(assigneeInfo)
          ? assigneeInfo
          : [assigneeInfo];
        if (assignees.length === 0) {
          return (
            <span className="text-sm font-medium text-slate-400">
              Unassigned
            </span>
          );
        }
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {assignees.map(
              (
                u: { firstName?: string; lastName?: string; image?: string },
                idx: number,
              ) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5"
                  title={`${u.firstName || ''} ${u.lastName || ''}`}
                >
                  {u.image ? (
                    <img
                      className="size-5 rounded-full object-cover"
                      src={u.image}
                      alt=""
                    />
                  ) : (
                    <div className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                      {u.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700">
                    {u.firstName || 'User'}
                  </span>
                </div>
              ),
            )}
          </div>
        );
      },
    },
    {
      title: 'Client',
      field: 'clientId',
      Cell({ entry: { clientInfo } }: { entry: Task }) {
        if (!clientInfo) {
          return (
            <span className="text-xs font-medium text-slate-400">N/A</span>
          );
        }
        return (
          <span className="border-indigo-150 inline-flex items-center gap-1 rounded-full border bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 text-slate-800">
            <Briefcase className="size-3 text-indigo-500" />
            {clientInfo.name}
          </span>
        );
      },
    },
    {
      title: 'Checklist',
      field: 'subtasks',
      Cell({ entry: { subtasks } }: { entry: Task }) {
        if (!subtasks || subtasks.length === 0) {
          return (
            <span className="text-xs font-medium text-slate-400">
              No subtasks
            </span>
          );
        }
        const completed = subtasks.filter((s) => s.isCompleted).length;
        const total = subtasks.length;
        const percent = Math.round((completed / total) * 100);
        return (
          <div className="w-24 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>
                {completed}/{total} Done
              </span>
              <span>{percent}%</span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#0EA5E9] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Priority',
      field: 'priority',
      Cell({ entry: { priority } }: { entry: Task }) {
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadgeStyle(priority)}`}
          >
            {getPriorityLabel(priority)}
          </span>
        );
      },
    },
    {
      title: 'Status',
      field: 'status',
      Cell({ entry: { id, _id, status } }: { entry: Task }) {
        const taskId = id || _id || '';
        return (
          <select
            className={`block w-32 cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all focus:ring-4 ${getStatusSelectStyle(status as number)}`}
            value={status}
            onChange={(e) => {
              updateTaskMutation.mutate({
                taskId,
                data: { status: Number(e.target.value) },
              });
            }}
            disabled={updateTaskMutation.isPending}
          >
            {isEmployee ? (
              <>
                {status !== TaskStatus.IN_PROGRESS &&
                  status !== TaskStatus.ON_HOLD && (
                    <option value={status} disabled>
                      {getStatusLabel(status as number)}
                    </option>
                  )}
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.ON_HOLD}>Hold</option>
              </>
            ) : (
              <>
                <option value={TaskStatus.PENDING}>Pending</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.ON_HOLD}>Hold</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
                <option value={TaskStatus.CANCELLED}>Cancelled</option>
              </>
            )}
          </select>
        );
      },
    },
    {
      title: 'Due Date',
      field: 'dueDate',
      Cell({ entry: { dueDate } }: { entry: Task }) {
        if (!dueDate)
          return (
            <span className="text-xs font-medium text-slate-400">
              No due date
            </span>
          );
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarIcon className="size-3.5 text-slate-400" />
            {formatDate(new Date(dueDate).getTime())}
          </div>
        );
      },
    },
    {
      title: '',
      field: 'id',
      Cell({ entry: { id, _id } }: { entry: Task }) {
        const taskId = id || _id || '';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-gray-200">
              <MoreVertical className="size-5 text-gray-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="cursor-pointer font-semibold text-slate-700"
                onClick={() => navigate(paths.app.editTask.getHref(taskId))}
              >
                <Edit2 className="mr-2 size-4 text-slate-500" />
                Edit Task
              </DropdownMenuItem>
              {!isEmployee && (
                <DropdownMenuItem
                  className="cursor-pointer font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTaskMutation.mutate({ taskId });
                    }
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // --- KANBAN BOARD VIEW HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTaskMutation.mutate({
        taskId,
        data: { status: targetStatus },
      });
    }
  };

  const handleDragOver = (e: React.DragEvent, status: number) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const kanbanColumns = [
    {
      title: 'Pending',
      status: TaskStatus.PENDING,
      color: 'border-t-slate-400 bg-slate-50/50',
    },
    {
      title: 'In Progress',
      status: TaskStatus.IN_PROGRESS,
      color: 'border-t-blue-500 bg-blue-50/20',
    },
    {
      title: 'Hold',
      status: TaskStatus.ON_HOLD,
      color: 'border-t-amber-500 bg-amber-50/20',
    },
    {
      title: 'Completed',
      status: TaskStatus.COMPLETED,
      color: 'border-t-emerald-500 bg-emerald-50/20',
    },
    {
      title: 'Cancelled',
      status: TaskStatus.CANCELLED,
      color: 'border-t-rose-400 bg-rose-50/20',
    },
  ];

  const renderKanbanBoard = (tasksList: Task[]) => {
    return (
      <div className="grid grid-cols-1 gap-6 duration-500 animate-in fade-in md:grid-cols-5">
        {kanbanColumns.map((col) => {
          const colTasks = tasksList.filter((t) => t.status === col.status);
          const isDragOver = dragOverColumn === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex min-h-[550px] flex-col rounded-2xl border border-t-4 border-slate-200/60 p-4 ${col.color} shadow-sm transition-all ${
                isDragOver
                  ? 'scale-[1.01] bg-indigo-50/10 ring-2 ring-indigo-300/50 ring-offset-1'
                  : ''
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  {col.title}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-slate-500">
                  {colTasks.length}
                </span>
              </div>
              <div className="custom-scrollbar max-h-[600px] flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div
                    className={`flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed text-[10px] font-bold transition-colors ${
                      isDragOver
                        ? 'border-indigo-300 bg-indigo-50/30 text-indigo-400'
                        : 'border-slate-200/50 text-slate-400'
                    }`}
                  >
                    {isDragOver ? 'Drop here' : 'Drag tasks here'}
                  </div>
                ) : (
                  colTasks.map((t) => {
                    const taskId = t.id || t._id || '';
                    return (
                      <div
                        key={taskId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, taskId)}
                        onClick={() =>
                          navigate(paths.app.editTask.getHref(taskId))
                        }
                        className="animate-card-enter group relative cursor-grab space-y-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${getPriorityKanbanStyle(t.priority)}`}
                          >
                            {getPriorityLabel(t.priority)}
                          </span>
                          {t.assigneeInfo ? (
                            (() => {
                              const assignees = Array.isArray(t.assigneeInfo)
                                ? t.assigneeInfo
                                : [t.assigneeInfo];
                              const firstUser = assignees[0] as
                                | { firstName?: string; lastName?: string }
                                | undefined;
                              if (!firstUser)
                                return (
                                  <div
                                    className="flex size-6 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-[9px] font-bold text-slate-400"
                                    title="Unassigned"
                                  >
                                    --
                                  </div>
                                );
                              return (
                                <div
                                  className="flex size-6 items-center justify-center rounded-full border border-slate-200 bg-indigo-50 text-[9px] font-extrabold text-indigo-700"
                                  title={assignees
                                    .map(
                                      (u) =>
                                        `${u.firstName || ''} ${u.lastName || ''}`,
                                    )
                                    .join(', ')}
                                >
                                  {firstUser.firstName?.[0]}
                                  {firstUser.lastName?.[0]}
                                </div>
                              );
                            })()
                          ) : (
                            <div
                              className="flex size-6 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-[9px] font-bold text-slate-400"
                              title="Unassigned"
                            >
                              --
                            </div>
                          )}
                        </div>
                        <h4 className="line-clamp-2 text-xs font-bold leading-relaxed text-slate-800">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-slate-450 line-clamp-2 text-[10px] font-medium leading-normal">
                            {t.description}
                          </p>
                        )}
                        {/* Subtask progress mini-bar */}
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-[#0EA5E9] transition-all duration-300"
                                style={{
                                  width: `${Math.round((t.subtasks.filter((s) => s.isCompleted).length / t.subtasks.length) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">
                              {t.subtasks.filter((s) => s.isCompleted).length}/
                              {t.subtasks.length}
                            </span>
                          </div>
                        )}
                        {t.dueDate && (
                          <div className="mt-2 flex items-center gap-1 border-t border-slate-50 pt-2 text-[10px] font-bold text-slate-400">
                            <Clock className="size-3" />
                            {new Date(t.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- CALENDAR VIEW STATE & HANDLERS ---

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const renderCalendar = (tasksList: Task[]) => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }

    const today = new Date();

    return (
      <div className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm duration-500 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="cursor-pointer rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleToday}
              className="text-slate-650 cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-xs font-bold transition-colors hover:bg-slate-50"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="cursor-pointer rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-inner">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="bg-slate-50/50 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[110px] bg-white p-2"
                />
              );
            }
            const dateStr = day.getDate();
            const isToday =
              day.getDate() === today.getDate() &&
              day.getMonth() === today.getMonth() &&
              day.getFullYear() === today.getFullYear();

            const dayTasks = tasksList.filter((t) => {
              if (!t.dueDate) return false;
              const due = new Date(t.dueDate);
              return (
                due.getDate() === day.getDate() &&
                due.getMonth() === day.getMonth() &&
                due.getFullYear() === day.getFullYear()
              );
            });

            return (
              <div
                key={day.toISOString()}
                className={`group relative flex min-h-[110px] flex-col justify-between border-t border-slate-100 bg-white p-2 text-left transition-colors hover:bg-slate-50/30`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-extrabold ${
                      isToday ? 'bg-[#1E3A8A] text-white' : 'text-slate-700'
                    }`}
                  >
                    {dateStr}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="custom-scrollbar max-h-[80px] flex-1 space-y-1 overflow-y-auto pr-0.5">
                  {dayTasks.map((t) => {
                    const taskId = t.id || t._id || '';
                    return (
                      <div
                        key={taskId}
                        onClick={() =>
                          navigate(paths.app.editTask.getHref(taskId))
                        }
                        className="border-slate-105 flex cursor-pointer items-center gap-1 truncate rounded-md border bg-slate-50 p-1 text-[9px] font-bold text-slate-700 transition-all hover:text-indigo-600"
                        title={t.title}
                      >
                        <span
                          className={`size-1.5 rounded-full ${getPriorityDotColor(t.priority)} shrink-0`}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const pagination = {
    totalPages,
    currentPage: page,
    rootUrl: '',
    totalItems: total,
  };

  // Initial state: ONLY for CEO, if no client is selected yet, show the "Which client's tasks would you like to view?" selection screen!
  if (isCEO && !clientVal) {
    return (
      <div className="animate-card-enter mx-auto max-w-5xl space-y-8 py-4">
        {/* Header Title */}
        <div className="space-y-3 rounded-3xl border border-slate-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur-md">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#1E3A8A] to-[#0EA5E9] text-white shadow-lg shadow-blue-500/20">
            <Briefcase className="size-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Which client's tasks would you like to view?
          </h2>
          <p className="mx-auto max-w-lg text-sm font-medium text-slate-500">
            Please select a client below to view their associated tasks, project
            status, and team assignments.
          </p>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 0: All Clients */}
          <div
            onClick={() => handleClientFilterChange('all')}
            className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-blue-800/20 bg-gradient-to-br from-[#1E3A8A] to-[#0EA5E9] p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  All Projects
                </span>
                <Building className="size-6 text-white/80" />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                All Clients Tasks
              </h3>
              <p className="text-xs font-medium leading-relaxed text-blue-100">
                View consolidated tasks across all clients in one unified table
                view.
              </p>
            </div>
            <div className="flex items-center pt-6 text-xs font-bold text-white transition-transform group-hover:translate-x-1">
              <span>View All Tasks</span>
              <ArrowRight className="ml-2 size-4" />
            </div>
          </div>

          {/* Client Specific Cards */}
          {clients.map((c) => {
            const cId = c._id || c.id || '';
            return (
              <div
                key={cId}
                onClick={() => handleClientFilterChange(cId)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-slate-50/80 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-extrabold tracking-wider text-indigo-700">
                      {c.status === 0 ? 'Active Client' : 'Inactive'}
                    </span>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50/80 text-sm font-bold text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      <Briefcase className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 transition-colors group-hover:text-indigo-600">
                    {c.name}
                  </h3>
                  {c.companyName && (
                    <p className="text-xs font-semibold text-slate-500">
                      Company:{' '}
                      <span className="text-slate-700">{c.companyName}</span>
                    </p>
                  )}
                  {c.description && (
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-400">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-6 text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Open Client Tasks</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Client Selection Bar */}
      {isCEO && (
        <div className="animate-card-enter flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/20">
              <Briefcase className="size-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Viewing Tasks For
              </span>
              <h3 className="text-base font-extrabold text-slate-800">
                {clientVal === 'all'
                  ? 'All Clients'
                  : selectedClient
                    ? `${selectedClient.name}${selectedClient.companyName ? ` (${selectedClient.companyName})` : ''}`
                    : 'Selected Client'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => handleClientFilterChange('')}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-slate-100 px-5 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200"
          >
            <RotateCcw className="size-4 text-slate-500" />
            Switch Client
          </button>
        </div>
      )}

      {/* Header section with search & creation */}
      <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-slate-100 bg-white/70 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="block w-full rounded-full border border-slate-200 bg-white px-5 py-2 text-sm shadow-inner transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {/* Client Select Dropdown */}
          {isCEO && (
            <select
              className="max-w-[180px] cursor-pointer truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              value={clientVal}
              onChange={(e) => handleClientFilterChange(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Member / Employee Select Dropdown */}
          {!isEmployee && (
            <select
              className="max-w-[200px] cursor-pointer truncate rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              value={assigneeVal}
              onChange={(e) => handleAssigneeFilterChange(e.target.value)}
            >
              <option value="">All Members</option>
              {usersList.map((u: User) => {
                const uId = u._id || u.id;
                const roleLabel =
                  u.role === 1 || u.role === 'MANAGER' || u.role === 'Manager'
                    ? 'Manager'
                    : u.role === 2 || u.role === 'TL'
                      ? 'TL'
                      : 'Employee';
                return (
                  <option key={uId} value={uId}>
                    {u.firstName} {u.lastName} ({roleLabel})
                  </option>
                );
              })}
            </select>
          )}

          {/* Status Filter */}
          <select
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            value={statusVal}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value={TaskStatus.PENDING}>Pending</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.ON_HOLD}>Hold</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
            <option value={TaskStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            value={priorityVal}
            onChange={(e) => handlePriorityFilterChange(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value={TaskPriority.LOW}>Low Priority</option>
            <option value={TaskPriority.MEDIUM}>Medium Priority</option>
            <option value={TaskPriority.HIGH}>High Priority</option>
          </select>

          {/* Date Filter (only visible for List and Kanban view) */}
          {currentView !== 'calendar' && (
            <select
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              value={
                currentView === 'kanban' ? dateVal || 'today' : dateVal || 'all'
              }
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="today">Today's Tasks</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Dates</option>
            </select>
          )}

          {/* Task count badge */}
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:inline-flex">
            {total} task{total !== 1 ? 's' : ''}
          </span>
        </div>

        {!isEmployee && (
          <Button
            onClick={() => navigate(paths.app.createTask.getHref())}
            icon={<Plus className="size-4" />}
            className="h-10 shrink-0 cursor-pointer rounded-full border-0 bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-600/15 transition-all hover:bg-indigo-500"
          >
            Create Task
          </Button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex w-fit rounded-2xl border border-slate-200/40 bg-slate-100 p-1">
        <button
          onClick={() => handleViewChange('list')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            currentView === 'list'
              ? 'border border-slate-200/20 bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <List className="size-3.5" />
          List
        </button>
        <button
          onClick={() => handleViewChange('kanban')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            currentView === 'kanban'
              ? 'border border-slate-200/20 bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Columns className="size-3.5" />
          Kanban Board
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            currentView === 'calendar'
              ? 'border border-slate-200/20 bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="size-3.5" />
          Calendar
        </button>
      </div>

      {currentView === 'kanban' ? (
        renderKanbanBoard(tasks || [])
      ) : currentView === 'calendar' ? (
        renderCalendar(tasks || [])
      ) : !tasks || tasks.length === 0 ? (
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 text-slate-500 shadow-sm duration-500 animate-in fade-in">
          <div className="mb-4 rounded-full border border-slate-100 bg-slate-50 p-4">
            <svg
              className="size-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-700">
            No tasks found
          </span>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Create a new task to get started or adjust your filters.
          </p>
        </div>
      ) : (
        <div className="duration-500 animate-in fade-in">
          <Table data={tasks} columns={columns} pagination={pagination} />
        </div>
      )}
    </div>
  );
};
