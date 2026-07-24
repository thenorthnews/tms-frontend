import { TaskStatus, TaskPriority } from '../types';

// ─── Priority Helpers ─────────────────────────────────────────────────────────

export const getPriorityLabel = (p: number): string => {
  switch (p) {
    case TaskPriority.HIGH:
      return 'High';
    case TaskPriority.MEDIUM:
      return 'Medium';
    default:
      return 'Low';
  }
};

export const getPriorityBadgeStyle = (p: number): string => {
  switch (p) {
    case TaskPriority.HIGH:
      return 'bg-red-50 text-red-700 border-red-200';
    case TaskPriority.MEDIUM:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

export const getPriorityKanbanStyle = (p: number): string => {
  switch (p) {
    case TaskPriority.HIGH:
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case TaskPriority.MEDIUM:
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export const getPriorityDotColor = (p: number): string => {
  switch (p) {
    case TaskPriority.HIGH:
      return 'bg-rose-500';
    case TaskPriority.MEDIUM:
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

export const getStatusLabel = (status: number): string => {
  switch (status) {
    case TaskStatus.COMPLETED:
      return 'Done';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.CANCELLED:
      return 'Blocked';
    default:
      return 'To Do';
  }
};

export const getStatusBadgeStyle = (s: number): string => {
  switch (s) {
    case TaskStatus.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case TaskStatus.CANCELLED:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const getStatusSelectStyle = (s: number): string => {
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

// ─── User Initials Helper ─────────────────────────────────────────────────────

export const getUserInitials = (
  firstName?: string,
  lastName?: string,
  fallback = 'SO',
): string => {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || fallback;
};

// ─── Overdue Helper ───────────────────────────────────────────────────────────

export const isTaskOverdue = (
  status: number,
  dueDate?: string | null,
): boolean => {
  if (status === TaskStatus.COMPLETED) return false;
  if (!dueDate) return false;
  const deadline = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
};

// ─── Time Display Helper ──────────────────────────────────────────────────────

export const formatTimeLogged = (
  timeLogs: Array<{ hours: number; minutes: number }>,
): { hours: number; minutes: number; totalMinutes: number } => {
  const totalMinutes = timeLogs.reduce(
    (acc, log) => acc + log.hours * 60 + log.minutes,
    0,
  );
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
};
