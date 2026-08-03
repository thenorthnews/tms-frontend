import { TaskStatus, TaskPriority } from '../types';

const toNum = (val: any): number => {
  if (val && typeof val === 'object' && 'id' in val) {
    return Number(val.id ?? 0);
  }
  return Number(val ?? 0);
};

// ─── Priority Helpers ─────────────────────────────────────────────────────────

export const getPriorityLabel = (p: any): string => {
  const val = toNum(p);
  switch (val) {
    case TaskPriority.HIGH:
      return 'High';
    case TaskPriority.MEDIUM:
      return 'Medium';
    default:
      return 'Low';
  }
};

export const getPriorityBadgeStyle = (p: any): string => {
  const val = toNum(p);
  switch (val) {
    case TaskPriority.HIGH:
      return 'bg-red-50 text-red-700 border-red-200';
    case TaskPriority.MEDIUM:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

export const getPriorityKanbanStyle = (p: any): string => {
  const val = toNum(p);
  switch (val) {
    case TaskPriority.HIGH:
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case TaskPriority.MEDIUM:
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export const getPriorityDotColor = (p: any): string => {
  const val = toNum(p);
  switch (val) {
    case TaskPriority.HIGH:
      return 'bg-rose-500';
    case TaskPriority.MEDIUM:
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

export const getStatusLabel = (status: any): string => {
  const val = toNum(status);
  switch (val) {
    case TaskStatus.COMPLETED:
      return 'Completed';
    case TaskStatus.IN_PROGRESS:
      return 'In Progress';
    case TaskStatus.ON_HOLD:
      return 'Hold';
    case TaskStatus.CANCELLED:
      return 'Blocked';
    default:
      return 'To Do';
  }
};

export const getStatusBadgeStyle = (s: any): string => {
  const val = toNum(s);
  switch (val) {
    case TaskStatus.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case TaskStatus.ON_HOLD:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case TaskStatus.CANCELLED:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const getStatusSelectStyle = (s: any): string => {
  const val = toNum(s);
  switch (val) {
    case TaskStatus.COMPLETED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20';
    case TaskStatus.ON_HOLD:
      return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20';
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
  status: any,
  dueDate?: string | null,
): boolean => {
  const val = toNum(status);
  if (val === TaskStatus.COMPLETED) return false;
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
