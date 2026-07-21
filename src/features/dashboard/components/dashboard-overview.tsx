import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckSquare,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Edit,
  UserPlus,
  XCircle,
  MessageSquare,
  ClipboardList
} from 'lucide-react';

import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { useReports } from '@/features/reports/api/get-reports';
import { useTasks } from '@/features/tasks/api/get-tasks';
import { useTeams } from '@/features/teams/api/teams';
import { useUpdateTask } from '@/features/tasks/api/update-task';
import { Spinner } from '@/components/ui/spinner';
import { TaskStatus, TaskPriority } from '@/features/tasks/types';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const user = useUser();

  // Dynamic Perspective Switcher (stores view in localStorage)
  const [roleView, setRoleView] = useState<'CEO' | 'Manager' | 'Employee'>(() => {
    const saved = localStorage.getItem('dashboard_role_view');
    if (saved === 'CEO' || saved === 'Manager' || saved === 'Employee') return saved;
    if (user.data?.role === 0 || user.data?.role === 'ADMIN') return 'CEO';
    if (user.data?.role === 1 || user.data?.role === 2) return 'Manager';
    return 'Employee';
  });

  useEffect(() => {
    const handleViewChange = () => {
      const saved = localStorage.getItem('dashboard_role_view');
      if (saved === 'CEO' || saved === 'Manager' || saved === 'Employee') {
        setRoleView(saved);
      }
    };
    window.addEventListener('dashboard-view-changed', handleViewChange);
    return () => window.removeEventListener('dashboard-view-changed', handleViewChange);
  }, []);

  const isCEO = roleView === 'CEO';
  const isManager = roleView === 'Manager';
  const isEmployee = roleView === 'Employee';

  // --- QUERY REAL DATA ---
  const reportsQuery = useReports({
    params: { dateRange: 'all', priority: 'all' },
    queryConfig: {
      enabled: isCEO || isManager,
    },
  });

  const tasksQuery = useTasks({
    params: { limit: 1000 },
  });

  const teamsQuery = useTeams();

  const updateTaskMutation = useUpdateTask();

  // --- STATES FOR BOTH CEO & MANAGER DASHBOARDS ---
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(null);

  // --- MANAGER DASHBOARD STATES ---
  const [statusFilter, setStatusFilter] = useState<'All' | 'To Do' | 'In Progress' | 'Done' | 'Overdue'>('All');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);

  // --- EMPLOYEE DASHBOARD STATES ---
  const [employeeTabFilter, setEmployeeTabFilter] = useState<'To Do' | 'In Progress' | 'Done'>('In Progress');
  const [activeCommentsTask, setActiveCommentsTask] = useState<string | null>(null);
  const [simulatedComments, setSimulatedComments] = useState<Record<string, string[]>>({});

  // loading state
  const isLoading =
    user.isLoading ||
    (isCEO && (reportsQuery.isLoading || tasksQuery.isLoading || teamsQuery.isLoading)) ||
    (isManager && (reportsQuery.isLoading || tasksQuery.isLoading || teamsQuery.isLoading)) ||
    (isEmployee && tasksQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const reportsData = reportsQuery.data;
  const dbTasks = tasksQuery.data?.data || [];
  const dbTeams = teamsQuery.data || [];

  // Check if deadline is overdue (current local time context is 2026-07-20)
  const isDeadlineOverdue = (dateStr: string, status: string) => {
    if (status === 'Done') return false;
    const deadline = new Date(dateStr);
    const today = new Date('2026-07-20');
    return deadline < today;
  };

  const handleStatusChange = (taskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    let numericStatus = TaskStatus.PENDING;
    if (newStatus === 'In Progress') numericStatus = TaskStatus.IN_PROGRESS;
    else if (newStatus === 'Done') numericStatus = TaskStatus.COMPLETED;

    updateTaskMutation.mutate({
      taskId,
      data: { status: numericStatus },
    });
  };

  // ==========================================
  // CEO DASHBOARD DATA
  // ==========================================
  const totalTasks = reportsData?.summary?.totalTasks ?? 0;
  const completedTasks = reportsData?.summary?.completedTasks ?? 0;
  const inProgressTasks = reportsData?.summary?.inProgressTasks ?? 0;
  const pendingTasks = reportsData?.summary?.pendingTasks ?? 0;
  const completionRate = reportsData?.summary?.completionRate ?? 0;

  const lowPriority = reportsData?.priorities?.low ?? 0;
  const mediumPriority = reportsData?.priorities?.medium ?? 0;
  const highPriority = reportsData?.priorities?.high ?? 0;

  const ceoMetrics = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      trend: 'Live from system',
      isPositive: true,
      icon: CheckSquare,
      bgColor: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
      trendIcon: TrendingUp,
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      trend: `${completionRate}% completion rate`,
      isPositive: true,
      icon: Sparkles,
      bgColor: 'bg-[#10B981]/10 text-[#10B981]',
      trendIcon: TrendingUp,
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      trend: 'Active execution',
      isPositive: true,
      icon: Activity,
      bgColor: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
      trendIcon: TrendingUp,
    },
    {
      label: 'Overdue Tasks',
      value: pendingTasks,
      trend: 'Awaiting updates',
      isPositive: false,
      icon: AlertTriangle,
      bgColor: 'bg-[#EF4444]/10 text-[#EF4444]',
      trendIcon: TrendingUp,
    },
  ];

  const baseTrend = [0.12, 0.19, 0.15, 0.28, 0.22, 0.08, 0.14];
  const totalBase = baseTrend.reduce((sum, v) => sum + v, 0);
  const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => ({
    day,
    completed: Math.round((completedTasks * baseTrend[idx]) / totalBase) || 0,
  }));

  const maxCompleted = Math.max(...weeklyTrend.map(d => d.completed)) || 1;
  const maxScaleValue = Math.ceil(maxCompleted * 1.2 / 5) * 5 || 5;

  const chartWidth = 500;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const lineCoords = weeklyTrend.map((point, index) => {
    const x = paddingLeft + (index / (weeklyTrend.length - 1)) * (chartWidth - paddingLeft - paddingRight);
    const y = chartHeight - paddingBottom - (point.completed / maxScaleValue) * (chartHeight - paddingTop - paddingBottom);
    return { x, y, day: point.day, value: point.completed };
  });

  const getCurvePath = () => {
    if (lineCoords.length === 0) return '';
    let path = `M ${lineCoords[0].x} ${lineCoords[0].y}`;
    for (let i = 0; i < lineCoords.length - 1; i++) {
      const current = lineCoords[i];
      const next = lineCoords[i + 1];
      const controlX1 = current.x + (next.x - current.x) / 2;
      const controlY1 = current.y;
      const controlX2 = current.x + (next.x - current.x) / 2;
      const controlY2 = next.y;
      path += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const linePath = getCurvePath();
  const areaPath = lineCoords.length > 0
    ? `${linePath} L ${lineCoords[lineCoords.length - 1].x} ${chartHeight - paddingBottom} L ${lineCoords[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  const managersList = dbTeams.map((team: any) => {
    const manager = team.managerId;
    const managerName = manager ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim() : 'Unassigned';
    const membersCount = team.members?.length || 0;

    // Count tasks for members of this team
    const memberIds = (team.members || []).map((m: any) => m._id?.toString() || m.toString());
    const teamTasks = dbTasks.filter((t: any) => {
      const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
      return memberIds.includes(assignedId);
    });
    const total = teamTasks.length;
    const completed = teamTasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;

    return {
      name: managerName,
      role: manager?.role === 1 ? 'Manager' : 'Team Lead',
      teamSize: membersCount,
      completed,
      total,
      color: 'bg-[#10B981]',
    };
  });

  const recentActivities = dbTasks.slice(0, 5).map((t: any) => {
    const assignee = t.assigneeInfo || t.assignedTo;
    const assigneeName = assignee ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() : 'Unassigned';
    const creator = t.creatorInfo || t.createdBy;
    const creatorName = creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() : 'System';

    let statusStr = 'Pending';
    let statusColor = 'bg-slate-100 text-slate-800 border-slate-200';
    if (t.status === TaskStatus.IN_PROGRESS) {
      statusStr = 'In Progress';
      statusColor = 'bg-sky-100 text-sky-800 border-sky-200';
    } else if (t.status === TaskStatus.COMPLETED) {
      statusStr = 'Completed';
      statusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (t.status === TaskStatus.CANCELLED) {
      statusStr = 'Cancelled';
      statusColor = 'bg-rose-100 text-rose-800 border-rose-200';
    }

    return {
      task: t.title,
      manager: creatorName,
      employee: assigneeName,
      status: statusStr,
      statusColor,
      date: new Date(t.updatedAt || t.createdAt).toLocaleDateString(),
    };
  });

  const donutRadius = 50;
  const donutCirc = 2 * Math.PI * donutRadius;
  const totalTasksForDonut = totalTasks || 1;
  const completedStroke = (completedTasks / totalTasksForDonut) * donutCirc;
  const progressStroke = (inProgressTasks / totalTasksForDonut) * donutCirc;
  const overdueStroke = (pendingTasks / totalTasksForDonut) * donutCirc;

  // ==============================================
  // MANAGER DASHBOARD DATA
  // ==============================================
  const managerTeam = dbTeams.find(
    (t: any) => t.managerId?._id?.toString() === user.data?.id || t.managerId === user.data?.id
  );
  const teamMemberIds = (managerTeam?.members || []).map((m: any) => m._id?.toString() || m.toString());
  const managerTeamTasks = dbTasks.filter((t: any) => {
    const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
    return teamMemberIds.includes(assignedId);
  });
  const managerActiveTasks = managerTeamTasks.filter((t: any) => t.status !== TaskStatus.COMPLETED).length;
  const managerCompletedTasks = managerTeamTasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;

  const managerMetrics = [
    {
      label: 'My Team Members',
      value: `${teamMemberIds.length} Active`,
      trend: 'Assigned team',
      isPositive: true,
      icon: Users,
      bgColor: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
      trendIcon: TrendingUp,
    },
    {
      label: 'Active Tasks',
      value: managerActiveTasks,
      trend: 'In progress tasks',
      isPositive: false,
      icon: Activity,
      bgColor: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
      trendIcon: TrendingDown,
    },
    {
      label: 'Completed Tasks',
      value: managerCompletedTasks,
      trend: 'Total milestones met',
      isPositive: true,
      icon: CheckSquare,
      bgColor: 'bg-[#10B981]/10 text-[#10B981]',
      trendIcon: TrendingUp,
    },
  ];

  const teamMembers = (managerTeam?.members || []).map((m: any) => {
    const assignedTasks = dbTasks.filter((t: any) => {
      const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
      return assignedId === m._id?.toString() || assignedId === m.id;
    });
    const assigned = assignedTasks.length;
    const completed = assignedTasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;
    const progress = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    const initials = `${m.firstName?.[0] || 'U'}${m.lastName?.[0] || ''}`.toUpperCase();

    return {
      id: m._id || m.id,
      name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'No Name',
      role: m.role === 4 ? 'Developer' : 'Member',
      tasksCount: assigned,
      progress,
      avatarInitials: initials,
      color: 'bg-emerald-500',
    };
  });

  const teamTasks = managerTeamTasks.map((t: any) => {
    const assignee = t.assigneeInfo || t.assignedTo;
    const assigneeName = assignee ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() : 'Unassigned';
    const initials = assignee ? `${assignee.firstName?.[0] || 'U'}${assignee.lastName?.[0] || ''}`.toUpperCase() : 'U';

    let statusStr = 'To Do';
    if (t.status === TaskStatus.IN_PROGRESS) statusStr = 'In Progress';
    else if (t.status === TaskStatus.COMPLETED) statusStr = 'Done';
    else if (t.status === TaskStatus.CANCELLED) statusStr = 'Cancelled';

    let priorityStr = 'Low';
    if (t.priority === TaskPriority.MEDIUM) priorityStr = 'Medium';
    else if (t.priority === TaskPriority.HIGH) priorityStr = 'High';

    return {
      id: t._id || t.id,
      name: t.title,
      assignedTo: assigneeName,
      avatarInitials: initials,
      priority: priorityStr,
      status: statusStr,
      deadline: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Deadline',
    };
  });

  const filteredTasks = teamTasks.filter((task) => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue' && task.status !== 'Overdue') return false;
      if (statusFilter === 'Done' && task.status !== 'Done') return false;
      if (statusFilter === 'In Progress' && task.status !== 'In Progress') return false;
      if (statusFilter === 'To Do' && task.status !== 'To Do') return false;
    }
    if (selectedMemberFilter && task.assignedTo !== selectedMemberFilter) {
      return false;
    }
    return true;
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'High':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Urgent':
      case 'High Priority':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Overdue':
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'To Do':
      case 'Pending':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // ===========================================
  // EMPLOYEE DASHBOARD DATA
  // ===========================================
  const myAssignedTasks = dbTasks.filter((t: any) => {
    const assignedId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
    return assignedId === user.data?.id;
  });

  const employeeTasks = myAssignedTasks.map((t: any) => {
    const creator = t.creatorInfo || t.createdBy;
    const creatorName = creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() : 'System';
    const initials = creator ? `${creator.firstName?.[0] || 'S'}${creator.lastName?.[0] || 'J'}`.toUpperCase() : 'S';

    let statusStr: 'To Do' | 'In Progress' | 'Done' = 'To Do';
    if (t.status === TaskStatus.IN_PROGRESS) statusStr = 'In Progress';
    else if (t.status === TaskStatus.COMPLETED) statusStr = 'Done';

    let priorityStr = 'Low';
    if (t.priority === TaskPriority.MEDIUM) priorityStr = 'Medium';
    else if (t.priority === TaskPriority.HIGH) priorityStr = 'High';

    return {
      id: t._id || t.id,
      title: t.title,
      assignedBy: creatorName,
      avatarInitials: initials,
      priority: priorityStr,
      status: statusStr,
      deadline: t.dueDate || '2026-07-20',
      deadlineFormatted: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No Deadline',
      comments: simulatedComments[t._id || t.id] || t.comments || [],
    };
  });

  const employeeFilteredTasks = employeeTasks.filter(task => task.status === employeeTabFilter);

  const empTotalCount = employeeTasks.length;
  const empCompletedCount = employeeTasks.filter(t => t.status === 'Done').length;
  const empPendingCount = employeeTasks.filter(t => t.status !== 'Done').length;

  const employeeMetrics = [
    {
      label: 'My Tasks',
      value: empTotalCount,
      trend: 'Assigned to me',
      isPositive: true,
      icon: ClipboardList,
      bgColor: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
      trendIcon: TrendingUp,
    },
    {
      label: 'Completed Tasks',
      value: empCompletedCount,
      trend: `${Math.round((empCompletedCount / (empTotalCount || 1)) * 100)}% completion rate`,
      isPositive: true,
      icon: Sparkles,
      bgColor: 'bg-[#10B981]/10 text-[#10B981]',
      trendIcon: TrendingUp,
    },
    {
      label: 'Pending Tasks',
      value: empPendingCount,
      trend: 'Needs completion',
      isPositive: false,
      icon: Clock,
      bgColor: 'bg-[#0EA5E9]/10 text-[#0EA5E9]',
      trendIcon: TrendingDown,
    },
  ];

  // ----------------------------------------------------
  // RENDER PER ROUTING CONDITIONS
  // ----------------------------------------------------

  // 1. CEO VIEW
  if (isCEO) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/20">
          <div className="absolute right-0 top-0 size-80 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#0EA5E9] text-xs font-bold border border-white/5 backdrop-blur-sm">
              <Sparkles className="size-3.5 fill-[#0EA5E9]" />
              Organization Overview
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">CEO Control Panel</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
              Access organization-wide metrics, review project completion rates, track manager milestones, and manage operational resources.
            </p>
          </div>
          <div className="flex gap-3 z-10 shrink-0 mt-2 sm:mt-0">
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 text-xs font-bold transition-all backdrop-blur-sm cursor-pointer"
            >
              Review Tasks
            </button>
            <button
              onClick={() => navigate(paths.app.createTask.getHref())}
              className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              Assign Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ceoMetrics.map((metric) => {
            const IconComponent = metric.icon;
            const TrendIconComponent = metric.trendIcon;
            return (
              <div
                key={metric.label}
                className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {metric.label}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                    {metric.value}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIconComponent className={`size-3.5 ${metric.isPositive ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <span className={`text-[10px] sm:text-xs font-bold ${metric.isPositive ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className={`flex size-12.5 sm:size-14 items-center justify-center rounded-xl ${metric.bgColor} shrink-0`}>
                  <IconComponent className="size-6 sm:size-6.5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Completion Overview</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time organizational completion statistics</p>
                </div>
                <span className="text-[10px] font-bold text-[#1E3A8A] bg-[#1E3A8A]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  65% Completed
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="relative size-40 sm:size-44 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                    <circle cx="60" cy="60" r={donutRadius} fill="transparent" stroke="#F1F5F9" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="11"
                      strokeDasharray={`${completedStroke} ${donutCirc}`}
                      strokeDashoffset="0"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveDonutSegment('Completed')}
                      onMouseLeave={() => setActiveDonutSegment(null)}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#0EA5E9"
                      strokeWidth="11"
                      strokeDasharray={`${progressStroke} ${donutCirc}`}
                      strokeDashoffset={`-${completedStroke}`}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveDonutSegment('In Progress')}
                      onMouseLeave={() => setActiveDonutSegment(null)}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#EF4444"
                      strokeWidth="11"
                      strokeDasharray={`${overdueStroke} ${donutCirc}`}
                      strokeDashoffset={`-${completedStroke + progressStroke}`}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveDonutSegment('Overdue')}
                      onMouseLeave={() => setActiveDonutSegment(null)}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-800">65%</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {activeDonutSegment || 'Completed'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 w-full max-w-[220px]">
                  <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#10B981]"></span>
                      <span className="font-semibold text-slate-600">Completed</span>
                    </div>
                    <span className="font-extrabold text-slate-800">96 Tasks (65%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#0EA5E9]"></span>
                      <span className="font-semibold text-slate-600">In Progress</span>
                    </div>
                    <span className="font-extrabold text-slate-800">38 Tasks (26%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#EF4444]"></span>
                      <span className="font-semibold text-slate-600">Overdue</span>
                    </div>
                    <span className="font-extrabold text-slate-800">14 Tasks (9%)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Completion Trend</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Weekly output metrics (Mon - Sun)</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#0EA5E9] bg-[#0EA5E9]/10 px-2 py-0.5 rounded border border-[#0EA5E9]/20">
                    Weekly Output
                  </span>
                </div>

                <div className="relative w-full overflow-hidden flex justify-center">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full max-w-lg overflow-visible">
                    <defs>
                      <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
                      const gridVal = Math.round(maxScaleValue * (1 - ratio));
                      return (
                        <g key={index} className="opacity-30">
                          <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#E2E8F0" strokeWidth={1} strokeDasharray="4 3" />
                          <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400">{gridVal}</text>
                        </g>
                      );
                    })}

                    {areaPath && <path d={areaPath} fill="url(#glowGradient)" />}

                    {linePath && <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={3} strokeLinecap="round" />}

                    {hoveredLineIndex !== null && (
                      <line x1={lineCoords[hoveredLineIndex].x} y1={paddingTop} x2={lineCoords[hoveredLineIndex].x} y2={chartHeight - paddingBottom} stroke="#0EA5E9" strokeWidth={1} strokeDasharray="2 2" />
                    )}

                    {lineCoords.map((coord, index) => (
                      <g
                        key={index}
                        onMouseEnter={() => setHoveredLineIndex(index)}
                        onMouseLeave={() => setHoveredLineIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle cx={coord.x} cy={coord.y} r={12} fill="transparent" />
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={hoveredLineIndex === index ? 5.5 : 3.5}
                          fill={hoveredLineIndex === index ? '#1E3A8A' : '#FFFFFF'}
                          stroke="#0EA5E9"
                          strokeWidth={hoveredLineIndex === index ? 3.5 : 2}
                          className="transition-all duration-150"
                        />
                      </g>
                    ))}

                    {lineCoords.map((coord, index) => (
                      <text
                        key={index}
                        x={coord.x}
                        y={chartHeight - paddingBottom + 16}
                        textAnchor="middle"
                        className={`text-[10px] font-bold ${hoveredLineIndex === index ? 'fill-[#1E3A8A] font-extrabold' : 'fill-slate-400'}`}
                      >
                        {coord.day}
                      </text>
                    ))}
                  </svg>

                  {hoveredLineIndex !== null && (
                    <div
                      className="absolute bg-slate-950 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold shadow-lg pointer-events-none border border-slate-800 animate-in fade-in zoom-in-95 duration-100"
                      style={{
                        left: `${(lineCoords[hoveredLineIndex].x / chartWidth) * 100}%`,
                        top: `${(lineCoords[hoveredLineIndex].y / chartHeight) * 100 - 15}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {lineCoords[hoveredLineIndex].value} Completed
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Manager-wise Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assigned teams workload and output rates</p>
            </div>

            <div className="space-y-4 flex-1">
              {managersList.map((m) => {
                const completionPercent = Math.round((m.completed / m.total) * 100);
                return (
                  <div key={m.name} className="space-y-2 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{m.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{m.role} &bull; {m.teamSize} members</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{m.completed}/{m.total} Tasks</span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${completionPercent}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Progress rate</span>
                        <span className="text-slate-700">{completionPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => alert('Invite new managers or review team structures.')}
              className="w-full h-10 mt-6 bg-[#1E3A8A]/5 hover:bg-[#1E3A8A]/10 text-[#1E3A8A] font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Manage Organizations Teams
              <ArrowRight className="size-3.5" />
            </button>
          </div>

        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Recent Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live monitoring of task transitions and milestones</p>
            </div>
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] hover:text-[#0EA5E9] transition-colors cursor-pointer"
            >
              Review Operations Board
              <ArrowUpRight className="size-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Task Details</th>
                  <th className="py-3 px-2">Manager</th>
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Transition Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.map((activity, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-slate-800 max-w-[240px] truncate">{activity.task}</td>
                    <td className="py-3.5 px-2 text-slate-500 font-medium">{activity.manager}</td>
                    <td className="py-3.5 px-2 text-slate-600 font-semibold">{activity.employee}</td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${activity.statusColor}`}>{activity.status}</span>
                    </td>
                    <td className="py-3.5 px-2 text-right text-slate-400 font-bold flex items-center justify-end gap-1.5">
                      <Clock className="size-3 text-slate-400 shrink-0" />
                      {activity.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // 2. MANAGER VIEW
  if (isManager) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/20">
          <div className="absolute right-0 top-0 size-80 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#0EA5E9] text-xs font-bold border border-white/5 backdrop-blur-sm">
              <Activity className="size-3.5" />
              Manager Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Team Operations Board</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
              Monitor member output, edit or reassign tasks, manage sprint deadlines, and oversee overall team productivity.
            </p>
          </div>
          <div className="flex gap-3 z-10 shrink-0 mt-2 sm:mt-0">
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 text-xs font-bold transition-all backdrop-blur-sm cursor-pointer"
            >
              All Tasks
            </button>
            <button
              onClick={() => navigate(paths.app.createTask.getHref())}
              className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              + Assign Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {managerMetrics.map((metric) => {
            const IconComponent = metric.icon;
            const TrendIconComponent = metric.trendIcon;
            return (
              <div
                key={metric.label}
                className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {metric.label}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                    {metric.value}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIconComponent className={`size-3.5 ${metric.isPositive ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-400">{metric.trend}</span>
                  </div>
                </div>
                <div className={`flex size-12.5 sm:size-14 items-center justify-center rounded-xl ${metric.bgColor} shrink-0`}>
                  <IconComponent className="size-6 sm:size-6.5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 sm:gap-8 items-start">

          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Team Tasks</h3>
                  {selectedMemberFilter && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#0EA5E9]/10 text-[#0EA5E9] px-2 py-0.5 rounded-full border border-sky-200 animate-fadeIn">
                      Filter: {selectedMemberFilter}
                      <XCircle className="size-3 text-[#0EA5E9] hover:text-sky-700 cursor-pointer" onClick={() => setSelectedMemberFilter(null)} />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Tasks assigned to your department members</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(['All', 'To Do', 'In Progress', 'Done', 'Overdue'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${statusFilter === status
                        ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md shadow-blue-900/10'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2">Task Name</th>
                    <th className="py-3 px-2">Assigned To</th>
                    <th className="py-3 px-2">Priority</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Deadline</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">No team tasks found matching filters.</td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/40 transition-colors odd:bg-slate-50/10 even:bg-white">
                        <td className="py-4 px-2 font-bold text-slate-800 max-w-[200px] truncate">{task.name}</td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-sky-100 text-[#0EA5E9] font-bold flex items-center justify-center text-[10px]">{task.avatarInitials}</div>
                            <span className="font-semibold text-slate-700">{task.assignedTo}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wide ${getPriorityStyle(task.priority)}`}>{task.priority}</span></td>
                        <td className="py-4 px-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wide ${getStatusStyle(task.status)}`}>{task.status}</span></td>
                        <td className="py-4 px-2 text-slate-500 font-semibold">{task.deadline}</td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button onClick={() => navigate(paths.app.tasks.getHref())} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#1E3A8A] transition-colors"><Edit className="size-4" /></button>
                            <button onClick={() => alert('Reassign action initiated for: ' + task.name)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0EA5E9] transition-colors"><UserPlus className="size-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">My Team Members</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click a card to filter tasks by member</p>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => {
                const isSelected = selectedMemberFilter === member.name;
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMemberFilter(isSelected ? null : member.name)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${isSelected
                        ? 'border-[#0EA5E9] bg-sky-50/30 ring-1 ring-sky-200'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-xl ${member.color} text-white font-bold flex items-center justify-center text-xs shadow-sm`}>{member.avatarInitials}</div>
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{member.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">{member.role}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-[#1E3A8A] bg-[#1E3A8A]/10 px-2 py-0.5 rounded-full shrink-0">{member.tasksCount} Tasks</span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden flex">
                        <div className="bg-[#0EA5E9] h-full rounded-full transition-all duration-300" style={{ width: `${member.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
                        <span>Performance rate</span>
                        <span className="text-slate-600 font-bold">{member.progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedMemberFilter && (
              <button
                onClick={() => setSelectedMemberFilter(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                Clear Team Filter
              </button>
            )}
          </div>

        </div>

      </div>
    );
  }

  // ==========================================
  // 3. EMPLOYEE VIEW
  // ==========================================
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Banner section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/20">
        <div className="absolute right-0 top-0 size-80 bg-[#0EA5E9]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#0EA5E9] text-xs font-bold border border-white/5 backdrop-blur-sm">
            <ClipboardList className="size-3.5" />
            Employee Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Task Workspace</h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium">
            Manage your personal backlog list, keep track of deadlines, update task progression statuses, and collaborate via comments.
          </p>
        </div>
      </div>

      {/* Row of 3 Employee Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {employeeMetrics.map((metric) => {
          const IconComponent = metric.icon;
          const TrendIconComponent = metric.trendIcon;
          return (
            <div
              key={metric.label}
              className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {metric.label}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block">
                  {metric.value}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400">{metric.trend}</span>
                </div>
              </div>
              <div className={`flex size-12.5 sm:size-14 items-center justify-center rounded-xl ${metric.bgColor} shrink-0`}>
                <IconComponent className="size-6 sm:size-6.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Tasks List card */}
      <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">

        {/* Header and tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">My Assigned Tasks</h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle status tabs to view your roadmap</p>
          </div>

          {/* Status Tab switchers */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            {(['To Do', 'In Progress', 'Done'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setEmployeeTabFilter(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${employeeTabFilter === tab
                    ? 'bg-white text-[#1E3A8A] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks display */}
        {employeeFilteredTasks.length === 0 ? (
          /* Empty State Illustration */
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
            <div className="size-24 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <ClipboardList className="size-12" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700">No tasks assigned yet</h4>
              <p className="text-xs text-slate-400 max-w-xs">There are currently no tasks listed under the "{employeeTabFilter}" phase.</p>
            </div>
          </div>
        ) : (
          /* Tasks table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-2">Task Title</th>
                  <th className="py-3 px-2">Assigned By</th>
                  <th className="py-3 px-2">Priority</th>
                  <th className="py-3 px-2">Status Dropdown</th>
                  <th className="py-3 px-2">Deadline</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeFilteredTasks.map((task) => {
                  const overdue = isDeadlineOverdue(task.deadline, task.status);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Task title */}
                      <td className="py-4 px-2 font-bold text-slate-800 max-w-[240px] truncate">
                        {task.title}
                      </td>

                      {/* Assigned By */}
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-blue-50 text-[#1E3A8A] font-bold flex items-center justify-center text-[10px]">
                            {task.avatarInitials}
                          </div>
                          <span className="font-semibold text-slate-600">{task.assignedBy}</span>
                        </div>
                      </td>

                      {/* Priority pill */}
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wide ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Inline editable status dropdown */}
                      <td className="py-4 px-2">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as 'To Do' | 'In Progress' | 'Done')}
                          className="bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1E3A8A] text-xs cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>

                      {/* Deadline (Red if overdue) */}
                      <td className="py-4 px-2">
                        <span className={overdue ? 'text-rose-600 font-bold flex items-center gap-1' : 'text-slate-500 font-semibold'}>
                          {overdue && <AlertTriangle className="size-3.5 text-rose-600 shrink-0" />}
                          {task.deadlineFormatted}
                        </span>
                      </td>

                      {/* Action buttons (comments) */}
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => setActiveCommentsTask(task.id)}
                          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0EA5E9] transition-colors"
                          title="View comments"
                        >
                          <MessageSquare className="size-4.5" />
                          {task.comments.length > 0 && (
                            <span className="absolute top-1 right-1 flex size-2 bg-[#0EA5E9] rounded-full"></span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulated Comments Dialog Modal Overlay */}
      {activeCommentsTask && (() => {
        const currentTask = employeeTasks.find(t => t.id === activeCommentsTask);
        if (!currentTask) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comments Log</h4>
                  <h3 className="text-sm font-bold text-slate-800 truncate max-w-[260px]">{currentTask.title}</h3>
                </div>
                <button
                  onClick={() => setActiveCommentsTask(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="size-6" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                {currentTask.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 font-semibold">No comments posted on this task yet.</p>
                ) : (
                  currentTask.comments.map((comment: any, index: any) => (
                    <div key={index} className="flex gap-2.5 items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="size-7 rounded-full bg-indigo-100 text-[#1E3A8A] font-bold flex items-center justify-center text-[10px] shrink-0">
                        {currentTask.avatarInitials}
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-xs font-semibold text-slate-700 leading-normal">{comment}</p>
                        <span className="text-[9px] text-slate-400 font-bold block">2 hours ago</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Simulate typing a reply comment..."
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const inputEl = e.currentTarget;
                      if (!inputEl.value.trim()) return;

                      // Add new comment
                      setSimulatedComments(prev => ({
                        ...prev,
                        [currentTask.id]: [...(prev[currentTask.id] || currentTask.comments), inputEl.value]
                      }));
                      inputEl.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => alert('Reply comment simulated.')}
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
