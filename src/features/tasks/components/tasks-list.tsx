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
import { useClients } from '@/features/clients/api/get-clients';
import { useUsers } from '@/features/users/api/get-users';
import { useUser } from '@/lib/auth';
import { useTasks } from '../api/get-tasks';
import { useUpdateTask } from '../api/update-task';
import { useDeleteTask } from '../api/delete-task';
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
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
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
  const isEmployee = currentUser?.role === 4 || currentUser?.role === 'Employee';
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
  const [dateVal, setDateVal] = useState(dateFilterParam || (currentView === 'kanban' ? 'today' : ''));
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
  }, [page, search, statusVal, priorityVal, clientVal, assigneeVal, currentView, dateVal, currentMonth, currentYear]);

  const selectedClient = useMemo(() => {
    if (!clientVal || clientVal === 'all') return null;
    return clients.find((c: any) => (c._id || c.id) === clientVal);
  }, [clients, clientVal]);

  const tasksQuery = useTasks({
    params: queryParams,
    queryConfig: { enabled: !isCEO || Boolean(clientVal) || Boolean(assigneeVal) },
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
      Cell({ entry: { title, description, tags } }: { entry: Task }) {
        return (
          <div className="space-y-1">
            <span className="font-bold text-slate-800 block">{title}</span>
            {description && (
              <span className="text-xs text-slate-400 font-medium block max-w-xs truncate">
                {description}
              </span>
            )}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150"
                  >
                    {tag}
                  </span>
                ))}
              </div>
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
          return <span className="text-slate-400 text-sm font-medium">Unassigned</span>;
        }
        const assignees = Array.isArray(assigneeInfo) ? assigneeInfo : [assigneeInfo];
        if (assignees.length === 0) {
          return <span className="text-slate-400 text-sm font-medium">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {assignees.map((u: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full" title={`${u.firstName || ''} ${u.lastName || ''}`}>
                {u.image ? (
                  <img className="h-5 w-5 rounded-full object-cover" src={u.image} alt="" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">
                    {u.firstName?.[0] || 'U'}
                  </div>
                )}
                <span className="font-semibold text-slate-700 text-xs">{u.firstName || 'User'}</span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Client',
      field: 'clientId',
      Cell({ entry: { clientInfo } }: { entry: Task }) {
        if (!clientInfo) {
          return <span className="text-slate-400 text-xs font-medium">N/A</span>;
        }
        return (
          <span className="font-semibold text-slate-800 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs border border-indigo-150 inline-flex items-center gap-1">
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
          return <span className="text-slate-400 text-xs font-medium">No subtasks</span>;
        }
        const completed = subtasks.filter((s) => s.isCompleted).length;
        const total = subtasks.length;
        const percent = Math.round((completed / total) * 100);
        return (
          <div className="space-y-1 w-24">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span>{completed}/{total} Done</span>
              <span>{percent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500"
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadgeStyle(priority)}`}>
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
            className={`block w-32 rounded-full border px-3 py-1.5 shadow-sm text-xs font-semibold focus:ring-4 transition-all cursor-pointer ${getStatusSelectStyle(status as number)}`}
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
                {status !== TaskStatus.IN_PROGRESS && status !== TaskStatus.ON_HOLD && (
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
        if (!dueDate) return <span className="text-slate-400 text-xs font-medium">No due date</span>;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
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
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-200">
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
    { title: 'Pending', status: TaskStatus.PENDING, color: 'border-t-slate-400 bg-slate-50/50' },
    { title: 'In Progress', status: TaskStatus.IN_PROGRESS, color: 'border-t-blue-500 bg-blue-50/20' },
    { title: 'Hold', status: TaskStatus.ON_HOLD, color: 'border-t-amber-500 bg-amber-50/20' },
    { title: 'Completed', status: TaskStatus.COMPLETED, color: 'border-t-emerald-500 bg-emerald-50/20' },
    { title: 'Cancelled', status: TaskStatus.CANCELLED, color: 'border-t-rose-400 bg-rose-50/20' },
  ];

  const renderKanbanBoard = (tasksList: Task[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-in fade-in duration-500">
        {kanbanColumns.map((col) => {
          const colTasks = tasksList.filter((t) => t.status === col.status);
          const isDragOver = dragOverColumn === col.status;
          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col min-h-[550px] rounded-2xl border border-slate-200/60 p-4 border-t-4 ${col.color} shadow-sm transition-all ${isDragOver ? 'ring-2 ring-indigo-300/50 ring-offset-1 bg-indigo-50/10 scale-[1.01]' : ''
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-800 text-sm">{col.title}</span>
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-extrabold text-slate-500">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1 custom-scrollbar">
                {colTasks.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl text-[10px] font-bold transition-colors ${isDragOver ? 'border-indigo-300 text-indigo-400 bg-indigo-50/30' : 'border-slate-200/50 text-slate-400'
                    }`}>
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
                        onClick={() => navigate(paths.app.editTask.getHref(taskId))}
                        className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing text-left space-y-2.5 relative group animate-card-enter"
                      >
                        <div className="flex justify-between items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityKanbanStyle(t.priority)}`}>
                            {getPriorityLabel(t.priority)}
                          </span>
                          {t.assigneeInfo ? (
                            (() => {
                              const assignees = Array.isArray(t.assigneeInfo) ? t.assigneeInfo : [t.assigneeInfo];
                              const firstUser: any = assignees[0];
                              if (!firstUser) return <div className="size-6 rounded-full bg-slate-50 text-slate-400 font-bold flex items-center justify-center text-[9px] border border-slate-100" title="Unassigned">--</div>;
                              return (
                                <div className="size-6 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-[9px] border border-slate-200" title={assignees.map((u: any) => `${u.firstName || ''} ${u.lastName || ''}`).join(', ')}>
                                  {firstUser.firstName?.[0]}{firstUser.lastName?.[0]}
                                </div>
                              );
                            })()
                          ) : (
                            <div className="size-6 rounded-full bg-slate-50 text-slate-400 font-bold flex items-center justify-center text-[9px] border border-slate-100" title="Unassigned">
                              --
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-relaxed">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-[10px] text-slate-450 font-medium line-clamp-2 leading-normal">
                            {t.description}
                          </p>
                        )}
                        {/* Subtask progress mini-bar */}
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-slate-100 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0EA5E9] h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.round((t.subtasks.filter(s => s.isCompleted).length / t.subtasks.length) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[8px] font-bold text-slate-400">
                              {t.subtasks.filter(s => s.isCompleted).length}/{t.subtasks.length}
                            </span>
                          </div>
                        )}
                        {t.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2 mt-2">
                            <Clock className="size-3" />
                            {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50 text-xs font-bold text-slate-650 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-inner">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-slate-50/50 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-white min-h-[110px] p-2" />;
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
                className={`bg-white min-h-[110px] p-2 flex flex-col justify-between hover:bg-slate-50/30 transition-colors group relative border-t border-slate-100 text-left`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-extrabold flex items-center justify-center size-6 rounded-full ${isToday ? 'bg-[#1E3A8A] text-white' : 'text-slate-700'
                    }`}>
                    {dateStr}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 max-h-[80px] pr-0.5 custom-scrollbar">
                  {dayTasks.map((t) => {
                    const taskId = t.id || t._id || '';
                    return (
                      <div
                        key={taskId}
                        onClick={() => navigate(paths.app.editTask.getHref(taskId))}
                        className="text-[9px] font-bold text-slate-700 truncate cursor-pointer hover:text-indigo-600 bg-slate-50 border border-slate-105 rounded-md p-1 flex items-center gap-1 transition-all"
                        title={t.title}
                      >
                        <span className={`size-1.5 rounded-full ${getPriorityDotColor(t.priority)} shrink-0`} />
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
      <div className="space-y-8 max-w-5xl mx-auto py-4 animate-card-enter">
        {/* Header Title */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-3">
          <div className="size-16 rounded-3xl bg-gradient-to-tr from-[#1E3A8A] to-[#0EA5E9] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <Briefcase className="size-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Which client's tasks would you like to view?
          </h2>
          <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
            Please select a client below to view their associated tasks, project status, and team assignments.
          </p>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 0: All Clients */}
          <div
            onClick={() => handleClientFilterChange('all')}
            className="group relative bg-gradient-to-br from-[#1E3A8A] to-[#0EA5E9] text-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden border border-blue-800/20 transform hover:-translate-y-1"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-md">
                  All Projects
                </span>
                <Building className="size-6 text-white/80" />
              </div>
              <h3 className="text-xl font-extrabold text-white">All Clients Tasks</h3>
              <p className="text-xs text-blue-100 leading-relaxed font-medium">
                View consolidated tasks across all clients in one unified table view.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
              <span>View All Tasks</span>
              <ArrowRight className="size-4 ml-2" />
            </div>
          </div>

          {/* Client Specific Cards */}
          {clients.map((c: any) => {
            const cId = c._id || c.id;
            return (
              <div
                key={cId}
                onClick={() => handleClientFilterChange(cId)}
                className="group relative bg-white hover:bg-slate-50/80 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                      {c.status === 0 ? 'Active Client' : 'Inactive'}
                    </span>
                    <div className="size-10 rounded-2xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Briefcase className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {c.name}
                  </h3>
                  {c.companyName && (
                    <p className="text-xs font-semibold text-slate-500">
                      Company: <span className="text-slate-700">{c.companyName}</span>
                    </p>
                  )}
                  {c.description && (
                    <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Open Client Tasks</span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
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
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-card-enter">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20 shrink-0">
              <Briefcase className="size-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
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
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer border-0 shrink-0"
          >
            <RotateCcw className="size-4 text-slate-500" />
            Switch Client
          </button>
        </div>
      )}

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

          {/* Client Select Dropdown */}
          {isCEO && (
            <select
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer max-w-[180px] truncate"
              value={clientVal}
              onChange={(e) => handleClientFilterChange(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map((c: any) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Member / Employee Select Dropdown */}
          {!isEmployee && (
            <select
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer max-w-[200px] truncate"
              value={assigneeVal}
              onChange={(e) => handleAssigneeFilterChange(e.target.value)}
            >
              <option value="">All Members</option>
              {usersList.map((u: any) => {
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
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
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
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
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
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
              value={currentView === 'kanban' ? (dateVal || 'today') : (dateVal || 'all')}
              onChange={(e) => handleDateFilterChange(e.target.value)}
            >
              <option value="today">Today's Tasks</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Dates</option>
            </select>
          )}

          {/* Task count badge */}
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full hidden sm:inline-flex">
            {total} task{total !== 1 ? 's' : ''}
          </span>
        </div>

        {!isEmployee && (
          <Button
            onClick={() => navigate(paths.app.createTask.getHref())}
            icon={<Plus className="size-4" />}
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/15 border-0 cursor-pointer transition-all shrink-0 h-10 px-6"
          >
            Create Task
          </Button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200/40">
        <button
          onClick={() => handleViewChange('list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'list'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <List className="size-3.5" />
          List
        </button>
        <button
          onClick={() => handleViewChange('kanban')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'kanban'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Columns className="size-3.5" />
          Kanban Board
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'calendar'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
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
