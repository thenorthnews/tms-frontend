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
  ClipboardList,
} from 'lucide-react';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useReports } from '@/features/reports/api/get-reports';
import { useTasks } from '@/features/tasks/api/get-tasks';
import { useUpdateTask } from '@/features/tasks/api/update-task';
import { Task, TaskStatus, TaskPriority } from '@/features/tasks/types';
import { useTeams } from '@/features/teams/api/teams';
import { useUser } from '@/lib/auth';
import { TeamMember, Team, User } from '@/types/api';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const user = useUser();

  const userRole = user.data?.role;
  const isEmployee = userRole === 4 || userRole === 'Employee';
  const isManager =
    userRole === 1 ||
    userRole === 2 ||
    userRole === 'Manager' ||
    userRole === 'Team Lead';
  const isCEO = userRole === 0 || userRole === 'CEO';

  // --- CEO DASHBOARD DATE FILTER STATE ---
  const [ceoDateFilter, setCeoDateFilter] = useState<
    'today' | 'week' | 'month' | 'all' | 'custom'
  >('all');
  const [ceoCustomDate, setCeoCustomDate] = useState<string>('');

  // --- QUERY REAL DATA ---
  const reportsQuery = useReports({
    params: { dateRange: 'all', priority: 'all' },
    queryConfig: {
      enabled: isCEO || isManager,
    },
  });

  const tasksQuery = useTasks({
    params: {
      limit: 1000,
      dateFilter:
        ceoDateFilter !== 'all' && ceoDateFilter !== 'custom'
          ? ceoDateFilter
          : undefined,
      startDate:
        ceoDateFilter === 'custom' && ceoCustomDate ? ceoCustomDate : undefined,
      endDate:
        ceoDateFilter === 'custom' && ceoCustomDate ? ceoCustomDate : undefined,
    },
  });

  const teamsQuery = useTeams();

  const updateTaskMutation = useUpdateTask();

  // --- STATES FOR BOTH CEO & MANAGER DASHBOARDS ---
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);
  const [activeDonutSegment, setActiveDonutSegment] = useState<string | null>(
    null,
  );

  // --- MANAGER DASHBOARD STATES ---
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'To Do' | 'In Progress' | 'Done' | 'Overdue'
  >('All');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<
    string | null
  >(null);

  // --- EMPLOYEE DASHBOARD STATES ---
  const [employeeTabFilter, setEmployeeTabFilter] = useState<
    'To Do' | 'In Progress' | 'Done'
  >('In Progress');
  const [activeCommentsTask, setActiveCommentsTask] = useState<string | null>(
    null,
  );
  const [simulatedComments, setSimulatedComments] = useState<
    Record<string, string[]>
  >({});

  // loading state
  const isLoading =
    user.isLoading ||
    (isCEO &&
      (reportsQuery.isLoading ||
        tasksQuery.isLoading ||
        teamsQuery.isLoading)) ||
    (isManager &&
      (reportsQuery.isLoading ||
        tasksQuery.isLoading ||
        teamsQuery.isLoading)) ||
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

  const handleStatusChange = (
    taskId: string,
    newStatus: 'To Do' | 'In Progress' | 'Done',
  ) => {
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
  const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
    (day, idx) => ({
      day,
      completed: Math.round((completedTasks * baseTrend[idx]) / totalBase) || 0,
    }),
  );

  const maxCompleted = Math.max(...weeklyTrend.map((d) => d.completed)) || 1;
  const maxScaleValue = Math.ceil((maxCompleted * 1.2) / 5) * 5 || 5;

  const chartWidth = 500;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const lineCoords = weeklyTrend.map((point, index) => {
    const x =
      paddingLeft +
      (index / (weeklyTrend.length - 1)) *
        (chartWidth - paddingLeft - paddingRight);
    const y =
      chartHeight -
      paddingBottom -
      (point.completed / maxScaleValue) *
        (chartHeight - paddingTop - paddingBottom);
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
  const areaPath =
    lineCoords.length > 0
      ? `${linePath} L ${lineCoords[lineCoords.length - 1].x} ${chartHeight - paddingBottom} L ${lineCoords[0].x} ${chartHeight - paddingBottom} Z`
      : '';

  const isTaskInDateRange = (
    task: Task,
    filter: 'today' | 'week' | 'month' | 'all' | 'custom',
    customDateStr: string,
  ) => {
    if (filter === 'all') return true;

    const rawDate = task.dueDate || task.createdAt;
    if (!rawDate) return false;
    const taskDate = new Date(rawDate);
    const now = new Date();

    if (filter === 'today') {
      return (
        taskDate.getFullYear() === now.getFullYear() &&
        taskDate.getMonth() === now.getMonth() &&
        taskDate.getDate() === now.getDate()
      );
    }

    if (filter === 'week') {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(
        now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
      );
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    }

    if (filter === 'month') {
      return (
        taskDate.getFullYear() === now.getFullYear() &&
        taskDate.getMonth() === now.getMonth()
      );
    }

    if (filter === 'custom' && customDateStr) {
      const cDate = new Date(customDateStr);
      return (
        taskDate.getFullYear() === cDate.getFullYear() &&
        taskDate.getMonth() === cDate.getMonth() &&
        taskDate.getDate() === cDate.getDate()
      );
    }

    return true;
  };

  const teamsTaskBreakdown = dbTeams.map((team: Team) => {
    const teamIdStr = (team._id || team.id)?.toString();
    const manager =
      team.managerId && typeof team.managerId === 'object'
        ? team.managerId
        : null;
    const managerName = manager
      ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim()
      : 'Unassigned';
    const memberIds = (team.members || []).map((m: TeamMember) =>
      typeof m === 'object' && m !== null
        ? (m._id || m.id)?.toString()
        : m?.toString(),
    );

    const teamTasks = dbTasks.filter((t: Task) => {
      const taskTeamId = (t.teamId || t.teamInfo?._id)?.toString();
      let matchesTeam = false;
      if (taskTeamId && teamIdStr) {
        matchesTeam = taskTeamId === teamIdStr;
      } else {
        const assigned = t.assignedTo;
        const assignedObj =
          assigned && typeof assigned === 'object' && !Array.isArray(assigned)
            ? (assigned as { _id?: string; id?: string })
            : null;
        const assignedId =
          typeof assigned === 'string'
            ? assigned
            : Array.isArray(assigned)
              ? typeof assigned[0] === 'string'
                ? assigned[0]
                : (assigned[0] as { _id?: string; id?: string })?._id ||
                  (assigned[0] as { _id?: string; id?: string })?.id ||
                  ''
              : assignedObj
                ? assignedObj._id || assignedObj.id || ''
                : '';
        matchesTeam = !!(
          assignedId && memberIds.includes(assignedId.toString())
        );
      }
      if (!matchesTeam) return false;

      return isTaskInDateRange(t, ceoDateFilter, ceoCustomDate);
    });

    const total = teamTasks.length;
    const pending = teamTasks.filter(
      (t: Task) => t.status === TaskStatus.PENDING,
    ).length;
    const inProgress = teamTasks.filter(
      (t: Task) => t.status === TaskStatus.IN_PROGRESS,
    ).length;
    const completed = teamTasks.filter(
      (t: Task) => t.status === TaskStatus.COMPLETED,
    ).length;
    const cancelled = teamTasks.filter(
      (t: Task) => t.status === TaskStatus.CANCELLED,
    ).length;
    const completionPercent =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: teamIdStr,
      teamName: team.name,
      managerName,
      membersCount: memberIds.length,
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      completionPercent,
    };
  });

  const recentActivities = dbTasks.slice(0, 5).map((t: Task) => {
    const assignee = t.assigneeInfo || t.assignedTo;
    const assigneeObj =
      typeof assignee === 'object' &&
      assignee !== null &&
      !Array.isArray(assignee)
        ? assignee
        : null;
    const assigneeName = assigneeObj
      ? `${assigneeObj.firstName || ''} ${assigneeObj.lastName || ''}`.trim()
      : 'Unassigned';
    const creator = t.creatorInfo || t.createdBy;
    const creatorObj =
      typeof creator === 'object' && creator !== null ? creator : null;
    const creatorName = creatorObj
      ? `${creatorObj.firstName || ''} ${creatorObj.lastName || ''}`.trim()
      : 'System';

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
  const managerTeam = dbTeams.find((t: Team) => {
    const mgr = t.managerId;
    const mgrId = (
      typeof mgr === 'object' && mgr !== null ? mgr._id || mgr.id : mgr
    )?.toString();
    const userIdStr = user.data?.id?.toString();
    return mgrId && mgrId === userIdStr;
  });
  const teamMemberIds = (managerTeam?.members || []).map((m: TeamMember) =>
    (m && typeof m === 'object' ? m._id || m.id : m)?.toString(),
  );
  const managerTeamTasks = dbTasks.filter((t: Task) => {
    const assigned = t.assignedTo;
    const assignedObj =
      assigned && typeof assigned === 'object' && !Array.isArray(assigned)
        ? (assigned as { _id?: string; id?: string })
        : null;
    const assignedId = (
      assignedObj
        ? assignedObj._id || assignedObj.id
        : typeof assigned === 'string'
          ? assigned
          : ''
    )?.toString();
    return assignedId && teamMemberIds.includes(assignedId);
  });
  const managerActiveTasks = managerTeamTasks.filter(
    (t: Task) => t.status !== TaskStatus.COMPLETED,
  ).length;
  const managerCompletedTasks = managerTeamTasks.filter(
    (t: Task) => t.status === TaskStatus.COMPLETED,
  ).length;

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

  const teamMembers = (managerTeam?.members || []).map((m: TeamMember) => {
    const memberObj = typeof m === 'object' && m !== null ? m : null;
    const memberIdStr = (
      memberObj ? memberObj._id || memberObj.id : m
    )?.toString();
    const assignedTasks = dbTasks.filter((t: Task) => {
      const assigned = t.assignedTo;
      const assignedObj =
        assigned && typeof assigned === 'object' && !Array.isArray(assigned)
          ? (assigned as { _id?: string; id?: string })
          : null;
      const assignedId = (
        assignedObj
          ? assignedObj._id || assignedObj.id
          : typeof assigned === 'string'
            ? assigned
            : ''
      )?.toString();
      return assignedId === memberIdStr;
    });
    const assigned = assignedTasks.length;
    const completed = assignedTasks.filter(
      (t: Task) => t.status === TaskStatus.COMPLETED,
    ).length;
    const progress =
      assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    const initials = memberObj
      ? `${memberObj.firstName?.[0] || 'U'}${memberObj.lastName?.[0] || ''}`.toUpperCase()
      : 'U';

    return {
      id: memberObj?._id || memberObj?.id || (typeof m === 'string' ? m : ''),
      name: memberObj
        ? `${memberObj.firstName || ''} ${memberObj.lastName || ''}`.trim()
        : 'No Name',
      role: (memberObj as { department?: string })?.department || 'Member',
      assigned,
      completed,
      progress,
      status: completed === assigned && assigned > 0 ? 'Completed' : 'On Track',
      initials,
      avatarInitials: initials,
      color: 'bg-emerald-500',
      tasksCount: assigned,
    };
  });

  const teamTasks = managerTeamTasks.map((t: Task) => {
    const assignee = t.assigneeInfo || t.assignedTo;
    const assigneeObj =
      typeof assignee === 'object' &&
      assignee !== null &&
      !Array.isArray(assignee)
        ? assignee
        : null;
    const assigneeName = assigneeObj
      ? `${assigneeObj.firstName || ''} ${assigneeObj.lastName || ''}`.trim()
      : 'Unassigned';
    const initials = assigneeObj
      ? `${assigneeObj.firstName?.[0] || 'U'}${assigneeObj.lastName?.[0] || ''}`.toUpperCase()
      : 'U';

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
      deadline: t.dueDate
        ? new Date(t.dueDate).toLocaleDateString()
        : 'No Deadline',
    };
  });

  const filteredTasks = teamTasks.filter((task) => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue' && task.status !== 'Overdue') return false;
      if (statusFilter === 'Done' && task.status !== 'Done') return false;
      if (statusFilter === 'In Progress' && task.status !== 'In Progress')
        return false;
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
  const myAssignedTasks = dbTasks.filter((t: Task) => {
    const assigned = t.assignedTo;
    const assignedObj =
      assigned && typeof assigned === 'object' && !Array.isArray(assigned)
        ? (assigned as { _id?: string; id?: string })
        : null;
    const assignedId = (
      assignedObj
        ? assignedObj._id || assignedObj.id
        : typeof assigned === 'string'
          ? assigned
          : ''
    )?.toString();
    const userIdStr = user.data?.id?.toString();
    return assignedId && assignedId === userIdStr;
  });

  const employeeTasks = myAssignedTasks.map((t: Task) => {
    const creator = t.creatorInfo || t.createdBy;
    const creatorObj =
      typeof creator === 'object' && creator !== null ? creator : null;
    const creatorName = creatorObj
      ? `${creatorObj.firstName || ''} ${creatorObj.lastName || ''}`.trim()
      : 'System';
    const initials = creatorObj
      ? `${creatorObj.firstName?.[0] || 'S'}${creatorObj.lastName?.[0] || 'J'}`.toUpperCase()
      : 'S';

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
      deadlineFormatted: t.dueDate
        ? new Date(t.dueDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : 'No Deadline',
      comments: t._id || t.id ? simulatedComments[t._id || t.id] || [] : [],
    };
  });

  const employeeFilteredTasks = employeeTasks.filter(
    (task) => task.status === employeeTabFilter,
  );

  const empTotalCount = employeeTasks.length;
  const empCompletedCount = employeeTasks.filter(
    (t) => t.status === 'Done',
  ).length;
  const empPendingCount = employeeTasks.filter(
    (t) => t.status !== 'Done',
  ).length;

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
      <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4 sm:space-y-8">
        <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-700/20 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
          <div className="z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-bold text-[#0EA5E9] backdrop-blur-sm">
              <Sparkles className="size-3.5 fill-[#0EA5E9]" />
              Organization Overview
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              CEO Control Panel
            </h1>
            <p className="max-w-xl text-xs font-medium text-slate-300 sm:text-sm">
              Access organization-wide metrics, review project completion rates,
              track manager milestones, and manage operational resources.
            </p>
          </div>
          <div className="z-10 mt-2 flex shrink-0 gap-3 sm:mt-0">
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Review Tasks
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {ceoMetrics.map((metric) => {
            const IconComponent = metric.icon;
            const TrendIconComponent = metric.trendIcon;
            return (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6"
              >
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                    {metric.label}
                  </span>
                  <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    {metric.value}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIconComponent
                      className={`size-3.5 ${metric.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}
                    />
                    <span
                      className={`text-[10px] font-bold sm:text-xs ${metric.isPositive ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div
                  className={`size-12.5 flex items-center justify-center rounded-xl sm:size-14 ${metric.bgColor} shrink-0`}
                >
                  <IconComponent className="sm:size-6.5 size-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="space-y-6 sm:space-y-8 lg:col-span-2">
            <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                    Completion Overview
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Real-time organizational completion statistics
                  </p>
                </div>
                <span className="rounded-full bg-[#1E3A8A]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                  65% Completed
                </span>
              </div>

              <div className="flex flex-col items-center justify-around gap-6 md:flex-row">
                <div className="relative flex size-40 shrink-0 items-center justify-center sm:size-44">
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#F1F5F9"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="11"
                      strokeDasharray={`${completedStroke} ${donutCirc}`}
                      strokeDashoffset="0"
                      className="cursor-pointer transition-all duration-300"
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
                      className="cursor-pointer transition-all duration-300"
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
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setActiveDonutSegment('Overdue')}
                      onMouseLeave={() => setActiveDonutSegment(null)}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-2xl font-extrabold text-slate-800 sm:text-3xl">
                      65%
                    </span>
                    <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeDonutSegment || 'Completed'}
                    </span>
                  </div>
                </div>

                <div className="w-full max-w-[220px] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#10B981]"></span>
                      <span className="font-semibold text-slate-600">
                        Completed
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      96 Tasks (65%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#0EA5E9]"></span>
                      <span className="font-semibold text-slate-600">
                        In Progress
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      38 Tasks (26%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-[#EF4444]"></span>
                      <span className="font-semibold text-slate-600">
                        Overdue
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      14 Tasks (9%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Completion Trend
                    </h4>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Weekly output metrics (Mon - Sun)
                    </p>
                  </div>
                  <span className="rounded border border-[#0EA5E9]/20 bg-[#0EA5E9]/10 px-2 py-0.5 text-[10px] font-bold text-[#0EA5E9]">
                    Weekly Output
                  </span>
                </div>

                <div className="relative flex w-full justify-center overflow-hidden">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full max-w-lg overflow-visible"
                  >
                    <defs>
                      <linearGradient
                        id="glowGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#0EA5E9"
                          stopOpacity="0.2"
                        />
                        <stop
                          offset="100%"
                          stopColor="#0EA5E9"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const y =
                        paddingTop +
                        ratio * (chartHeight - paddingTop - paddingBottom);
                      const gridVal = Math.round(maxScaleValue * (1 - ratio));
                      return (
                        <g key={index} className="opacity-30">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="#E2E8F0"
                            strokeWidth={1}
                            strokeDasharray="4 3"
                          />
                          <text
                            x={paddingLeft - 8}
                            y={y + 3}
                            textAnchor="end"
                            className="fill-slate-400 text-[9px] font-bold"
                          >
                            {gridVal}
                          </text>
                        </g>
                      );
                    })}

                    {areaPath && (
                      <path d={areaPath} fill="url(#glowGradient)" />
                    )}

                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#0EA5E9"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    )}

                    {hoveredLineIndex !== null && (
                      <line
                        x1={lineCoords[hoveredLineIndex].x}
                        y1={paddingTop}
                        x2={lineCoords[hoveredLineIndex].x}
                        y2={chartHeight - paddingBottom}
                        stroke="#0EA5E9"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                    )}

                    {lineCoords.map((coord, index) => (
                      <g
                        key={index}
                        onMouseEnter={() => setHoveredLineIndex(index)}
                        onMouseLeave={() => setHoveredLineIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={12}
                          fill="transparent"
                        />
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r={hoveredLineIndex === index ? 5.5 : 3.5}
                          fill={
                            hoveredLineIndex === index ? '#1E3A8A' : '#FFFFFF'
                          }
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
                      className="pointer-events-none absolute rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg duration-100 animate-in fade-in zoom-in-95"
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

          <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                  Team Task Statistics
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  Filter tasks by date for each team
                </p>
              </div>

              {/* Date Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setCeoDateFilter('today')}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    ceoDateFilter === 'today'
                      ? 'shadow-xs bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCeoDateFilter('week')}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    ceoDateFilter === 'week'
                      ? 'shadow-xs bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setCeoDateFilter('month')}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    ceoDateFilter === 'month'
                      ? 'shadow-xs bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setCeoDateFilter('all')}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    ceoDateFilter === 'all'
                      ? 'shadow-xs bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCeoDateFilter('custom')}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                    ceoDateFilter === 'custom'
                      ? 'shadow-xs bg-[#1E3A8A] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Date
                </button>
              </div>
            </div>

            {/* Custom Date Picker Input */}
            {ceoDateFilter === 'custom' && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Calendar className="size-4 text-[#0EA5E9]" />
                  <span>Select Date:</span>
                </div>
                <input
                  type="date"
                  value={ceoCustomDate}
                  onChange={(e) => setCeoCustomDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 focus:border-[#1E3A8A] focus:outline-none"
                />
              </div>
            )}

            <div className="max-h-[480px] flex-1 space-y-4 overflow-y-auto pr-1">
              {teamsTaskBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                  No team tasks found
                </div>
              ) : (
                teamsTaskBreakdown.map((t) => (
                  <div
                    key={t.id || t.teamName}
                    className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 transition-all hover:border-slate-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800">
                          {t.teamName}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-400">
                          Manager: {t.managerName} &bull; {t.membersCount}{' '}
                          members
                        </p>
                      </div>
                      <span className="shadow-2xs rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-[#1E3A8A]">
                        {t.total} Total Tasks
                      </span>
                    </div>

                    {/* Status Pill Badges Grid */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700">
                        <span className="block font-bold">To Do</span>
                        <span className="text-xs font-extrabold">
                          {t.pending}
                        </span>
                      </div>
                      <div className="rounded-lg border border-sky-200 bg-sky-50 p-1.5 text-sky-700">
                        <span className="block font-bold">In Progress</span>
                        <span className="text-xs font-extrabold">
                          {t.inProgress}
                        </span>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700">
                        <span className="block font-bold">Completed</span>
                        <span className="text-xs font-extrabold">
                          {t.completed}
                        </span>
                      </div>
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-700">
                        <span className="block font-bold">Blocked</span>
                        <span className="text-xs font-extrabold">
                          {t.cancelled}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${t.completionPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>Completion Rate</span>
                        <span className="font-extrabold text-slate-700">
                          {t.completionPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => navigate(paths.app.teams.getHref())}
              className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-[#1E3A8A]/5 text-xs font-bold text-[#1E3A8A] transition-colors hover:bg-[#1E3A8A]/10"
            >
              Manage Organization Teams
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                Recent Activity
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Live monitoring of task transitions and milestones
              </p>
            </div>
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#1E3A8A] transition-colors hover:text-[#0EA5E9]"
            >
              Review Operations Board
              <ArrowUpRight className="size-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-2 py-3">Task Details</th>
                  <th className="px-2 py-3">Manager</th>
                  <th className="px-2 py-3">Employee</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3 text-right">Transition Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.map((activity, index) => (
                  <tr
                    key={index}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="max-w-[240px] truncate px-2 py-3.5 font-bold text-slate-800">
                      {activity.task}
                    </td>
                    <td className="px-2 py-3.5 font-medium text-slate-500">
                      {activity.manager}
                    </td>
                    <td className="px-2 py-3.5 font-semibold text-slate-600">
                      {activity.employee}
                    </td>
                    <td className="px-2 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${activity.statusColor}`}
                      >
                        {activity.status}
                      </span>
                    </td>
                    <td className="flex items-center justify-end gap-1.5 px-2 py-3.5 text-right font-bold text-slate-400">
                      <Clock className="size-3 shrink-0 text-slate-400" />
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
      <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4 sm:space-y-8">
        <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-700/20 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
          <div className="z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-bold text-[#0EA5E9] backdrop-blur-sm">
              <Activity className="size-3.5" />
              Manager Workspace
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Team Operations Board
            </h1>
            <p className="max-w-xl text-xs font-medium text-slate-300 sm:text-sm">
              Monitor member output, edit or reassign tasks, manage sprint
              deadlines, and oversee overall team productivity.
            </p>
          </div>
          <div className="z-10 mt-2 flex shrink-0 gap-3 sm:mt-0">
            <button
              onClick={() => navigate(paths.app.tasks.getHref())}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              All Tasks
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {managerMetrics.map((metric) => {
            const IconComponent = metric.icon;
            const TrendIconComponent = metric.trendIcon;
            return (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6"
              >
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                    {metric.label}
                  </span>
                  <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    {metric.value}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIconComponent
                      className={`size-3.5 ${metric.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}
                    />
                    <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div
                  className={`size-12.5 flex items-center justify-center rounded-xl sm:size-14 ${metric.bgColor} shrink-0`}
                >
                  <IconComponent className="sm:size-6.5 size-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-10">
          <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                    Team Tasks
                  </h3>
                  {selectedMemberFilter && (
                    <span className="animate-fadeIn inline-flex items-center gap-1 rounded-full border border-sky-200 bg-[#0EA5E9]/10 px-2 py-0.5 text-[10px] font-bold text-[#0EA5E9]">
                      Filter: {selectedMemberFilter}
                      <XCircle
                        className="size-3 cursor-pointer text-[#0EA5E9] hover:text-sky-700"
                        onClick={() => setSelectedMemberFilter(null)}
                      />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Tasks assigned to your department members
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(
                  ['All', 'To Do', 'In Progress', 'Done', 'Overdue'] as const
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all ${
                      statusFilter === status
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-md shadow-blue-900/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-2 py-3">Task Name</th>
                    <th className="px-2 py-3">Assigned To</th>
                    <th className="px-2 py-3">Priority</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center font-semibold text-slate-400"
                      >
                        No team tasks found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="transition-colors odd:bg-slate-50/10 even:bg-white hover:bg-slate-50/40"
                      >
                        <td className="max-w-[200px] truncate px-2 py-4 font-bold text-slate-800">
                          {task.name}
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-[#0EA5E9]">
                              {task.avatarInitials}
                            </div>
                            <span className="font-semibold text-slate-700">
                              {task.assignedTo}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getPriorityStyle(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getStatusStyle(task.status)}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-2 py-4 font-semibold text-slate-500">
                          {task.deadline}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                My Team Members
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Click a card to filter tasks by member
              </p>
            </div>

            <div className="space-y-3">
              {teamMembers.map((member) => {
                const isSelected = selectedMemberFilter === member.name;
                return (
                  <div
                    key={member.id}
                    onClick={() =>
                      setSelectedMemberFilter(isSelected ? null : member.name)
                    }
                    className={`flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-[#0EA5E9] bg-sky-50/30 ring-1 ring-sky-200'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-8 rounded-xl ${member.color} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                        >
                          {member.avatarInitials}
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-bold leading-tight text-slate-800">
                            {member.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#1E3A8A]/10 px-2 py-0.5 text-[9px] font-bold text-[#1E3A8A]">
                        {member.tasksCount} Tasks
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#0EA5E9] transition-all duration-300"
                          style={{ width: `${member.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400">
                        <span>Performance rate</span>
                        <span className="font-bold text-slate-600">
                          {member.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedMemberFilter && (
              <button
                onClick={() => setSelectedMemberFilter(null)}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
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
    <div className="space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4 sm:space-y-8">
      {/* Top Banner section */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-slate-700/20 bg-gradient-to-r from-[#1E3A8A] via-[#10348a] to-[#0A192F] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-[#0EA5E9]/10 blur-3xl" />
        <div className="z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/10 px-3 py-1 text-xs font-bold text-[#0EA5E9] backdrop-blur-sm">
            <ClipboardList className="size-3.5" />
            Employee Dashboard
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            My Task Workspace
          </h1>
          <p className="max-w-xl text-xs font-medium text-slate-300 sm:text-sm">
            Manage your personal backlog list, keep track of deadlines, update
            task progression statuses, and collaborate via comments.
          </p>
        </div>
      </div>

      {/* Row of 3 Employee Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {employeeMetrics.map((metric) => {
          const IconComponent = metric.icon;
          const TrendIconComponent = metric.trendIcon;
          return (
            <div
              key={metric.label}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6"
            >
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
                  {metric.label}
                </span>
                <span className="block text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {metric.value}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                    {metric.trend}
                  </span>
                </div>
              </div>
              <div
                className={`size-12.5 flex items-center justify-center rounded-xl sm:size-14 ${metric.bgColor} shrink-0`}
              >
                <IconComponent className="sm:size-6.5 size-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content: Tasks List card */}
      <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        {/* Header and tab switcher */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-bold text-slate-800 sm:text-lg">
              My Assigned Tasks
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Toggle status tabs to view your roadmap
            </p>
          </div>

          {/* Status Tab switchers */}
          <div className="flex w-fit rounded-xl bg-slate-100 p-1">
            {(['To Do', 'In Progress', 'Done'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setEmployeeTabFilter(tab)}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  employeeTabFilter === tab
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
          <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center duration-300 animate-in fade-in">
            <div className="flex size-24 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-300">
              <ClipboardList className="size-12" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700">
                No tasks assigned yet
              </h4>
              <p className="max-w-xs text-xs text-slate-400">
                There are currently no tasks listed under the "
                {employeeTabFilter}" phase.
              </p>
            </div>
          </div>
        ) : (
          /* Tasks table */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-2 py-3">Task Title</th>
                  <th className="px-2 py-3">Assigned By</th>
                  <th className="px-2 py-3">Priority</th>
                  <th className="px-2 py-3">Status Dropdown</th>
                  <th className="px-2 py-3">Deadline</th>
                  <th className="px-2 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeFilteredTasks.map((task) => {
                  const overdue = isDeadlineOverdue(task.deadline, task.status);
                  return (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-slate-50/40"
                    >
                      {/* Task title */}
                      <td className="max-w-[240px] truncate px-2 py-4 font-bold text-slate-800">
                        {task.title}
                      </td>

                      {/* Assigned By */}
                      <td className="px-2 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-[#1E3A8A]">
                            {task.avatarInitials}
                          </div>
                          <span className="font-semibold text-slate-600">
                            {task.assignedBy}
                          </span>
                        </div>
                      </td>

                      {/* Priority pill */}
                      <td className="px-2 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${getPriorityStyle(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Inline editable status dropdown */}
                      <td className="px-2 py-4">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id,
                              e.target.value as
                                | 'To Do'
                                | 'In Progress'
                                | 'Done',
                            )
                          }
                          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-[#1E3A8A] focus:outline-none"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>

                      {/* Deadline (Red if overdue) */}
                      <td className="px-2 py-4">
                        <span
                          className={
                            overdue
                              ? 'flex items-center gap-1 font-bold text-rose-600'
                              : 'font-semibold text-slate-500'
                          }
                        >
                          {overdue && (
                            <AlertTriangle className="size-3.5 shrink-0 text-rose-600" />
                          )}
                          {task.deadlineFormatted}
                        </span>
                      </td>

                      {/* Action buttons (comments) */}
                      <td className="px-2 py-4 text-right">
                        <button
                          onClick={() => setActiveCommentsTask(task.id)}
                          className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0EA5E9]"
                          title="View comments"
                        >
                          <MessageSquare className="size-4.5" />
                          {task.comments.length > 0 && (
                            <span className="absolute right-1 top-1 flex size-2 rounded-full bg-[#0EA5E9]"></span>
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
      {activeCommentsTask &&
        (() => {
          const currentTask = employeeTasks.find(
            (t) => t.id === activeCommentsTask,
          );
          if (!currentTask) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl duration-200 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Comments Log
                    </h4>
                    <h3 className="max-w-[260px] truncate text-sm font-bold text-slate-800">
                      {currentTask.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveCommentsTask(null)}
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  >
                    <XCircle className="size-6" />
                  </button>
                </div>

                <div className="max-h-[300px] space-y-4 overflow-y-auto p-6">
                  {currentTask.comments.length === 0 ? (
                    <p className="py-6 text-center text-xs font-semibold text-slate-400">
                      No comments posted on this task yet.
                    </p>
                  ) : (
                    currentTask.comments.map(
                      (comment: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-[#1E3A8A]">
                            {currentTask.avatarInitials}
                          </div>
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-semibold leading-normal text-slate-700">
                              {comment}
                            </p>
                            <span className="block text-[9px] font-bold text-slate-400">
                              2 hours ago
                            </span>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>

                <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4">
                  <input
                    type="text"
                    placeholder="Simulate typing a reply comment..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1E3A8A] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const inputEl = e.currentTarget;
                        if (!inputEl.value.trim()) return;

                        // Add new comment
                        setSimulatedComments((prev) => ({
                          ...prev,
                          [currentTask.id]: [
                            ...(prev[currentTask.id] || currentTask.comments),
                            inputEl.value,
                          ],
                        }));
                        inputEl.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const inputEl = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      if (inputEl && inputEl.value.trim()) {
                        setSimulatedComments((prev) => ({
                          ...prev,
                          [currentTask.id]: [
                            ...(prev[currentTask.id] || currentTask.comments),
                            inputEl.value.trim(),
                          ],
                        }));
                        inputEl.value = '';
                      }
                    }}
                    className="cursor-pointer rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#152a63]"
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
