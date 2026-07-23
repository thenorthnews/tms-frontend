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
  Clock
} from 'lucide-react';
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
import { useUser } from '@/lib/auth';
import { useTasks } from '../api/get-tasks';
import { useUpdateTask } from '../api/update-task';
import { useDeleteTask } from '../api/delete-task';
import { TaskStatus, TaskPriority, Task } from '../types';

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
  const isEmployee = currentUser?.role === 4;

  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = +(searchParams.get('page') || 1);
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status');
  const priorityFilter = searchParams.get('priority');
  const dateFilterParam = searchParams.get('dateFilter');
  const currentView = searchParams.get('view') || 'list';

  const [searchVal, setSearchVal] = useState(search);
  const [statusVal, setStatusVal] = useState(statusFilter || '');
  const [priorityVal, setPriorityVal] = useState(priorityFilter || '');
  const [dateVal, setDateVal] = useState(dateFilterParam || (currentView === 'kanban' ? 'today' : ''));
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
  }, [page, search, statusVal, priorityVal, currentView, dateVal, currentMonth, currentYear]);

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
      Cell({ entry: { title, description, tags } }: any) {
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
      title: 'Checklist',
      field: 'subtasks',
      Cell({ entry: { subtasks } }: any) {
        if (!subtasks || subtasks.length === 0) {
          return <span className="text-slate-400 text-xs font-medium">No subtasks</span>;
        }
        const completed = subtasks.filter((s: any) => s.isCompleted).length;
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
                className="bg-[#0EA5E9] h-full rounded-full transition-all duration-300"
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
            <CalendarIcon className="size-3.5 text-slate-400" />
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

  // --- KANBAN BOARD VIEW HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTaskMutation.mutate({
        taskId,
        data: { status: targetStatus },
      });
    }
  };

  const kanbanColumns = [
    { title: 'Pending', status: TaskStatus.PENDING, color: 'border-t-slate-400 bg-slate-50/50' },
    { title: 'In Progress', status: TaskStatus.IN_PROGRESS, color: 'border-t-blue-500 bg-blue-50/20' },
    { title: 'Completed', status: TaskStatus.COMPLETED, color: 'border-t-emerald-500 bg-emerald-50/20' },
    { title: 'Cancelled', status: TaskStatus.CANCELLED, color: 'border-t-rose-400 bg-rose-50/20' },
  ];

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case TaskPriority.HIGH: return 'High';
      case TaskPriority.MEDIUM: return 'Medium';
      default: return 'Low';
    }
  };

  const getPriorityBadgeStyle = (p: number) => {
    switch (p) {
      case TaskPriority.HIGH:
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case TaskPriority.MEDIUM:
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const renderKanbanBoard = (tasksList: Task[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
        {kanbanColumns.map((col) => {
          const colTasks = tasksList.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex flex-col min-h-[550px] rounded-2xl border border-slate-200/60 p-4 border-t-4 ${col.color} shadow-sm transition-all`}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-800 text-sm">{col.title}</span>
                <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-extrabold text-slate-500">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200/50 rounded-xl text-slate-400 text-[10px] font-bold">
                    Drag tasks here
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
                        className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing text-left space-y-2.5 relative group"
                      >
                        <div className="flex justify-between items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadgeStyle(t.priority)}`}>
                            {getPriorityLabel(t.priority)}
                          </span>
                          {t.assigneeInfo ? (
                            <div className="size-6 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-[9px] border border-slate-200" title={`${t.assigneeInfo.firstName} ${t.assigneeInfo.lastName}`}>
                              {t.assigneeInfo.firstName?.[0]}{t.assigneeInfo.lastName?.[0]}
                            </div>
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
                  <span className={`text-xs font-extrabold flex items-center justify-center size-6 rounded-full ${
                    isToday ? 'bg-[#1E3A8A] text-white' : 'text-slate-700'
                  }`}>
                    {dateStr}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 max-h-[80px] pr-0.5">
                  {dayTasks.map((t) => {
                    const taskId = t.id || t._id || '';
                    const getPriorityColor = (p: number) => {
                      switch (p) {
                        case TaskPriority.HIGH: return 'bg-rose-500';
                        case TaskPriority.MEDIUM: return 'bg-amber-500';
                        default: return 'bg-slate-400';
                      }
                    };
                    return (
                      <div
                        key={taskId}
                        onClick={() => navigate(paths.app.editTask.getHref(taskId))}
                        className="text-[9px] font-bold text-slate-700 truncate cursor-pointer hover:text-indigo-600 bg-slate-50 border border-slate-105 rounded-md p-1 flex items-center gap-1 transition-all"
                        title={t.title}
                      >
                        <span className={`size-1.5 rounded-full ${getPriorityColor(t.priority)} shrink-0`} />
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentView === 'list'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <List className="size-3.5" />
          List
        </button>
        <button
          onClick={() => handleViewChange('kanban')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentView === 'kanban'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Columns className="size-3.5" />
          Kanban Board
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentView === 'calendar'
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
