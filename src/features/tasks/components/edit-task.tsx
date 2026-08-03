import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  UserCheck,
  CheckSquare,
  AlertCircle,
  Paperclip,
  FileText,
  X,
  PauseCircle,
  PlayCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { z } from 'zod';
import { User, Team } from '@/types/api';
import { api, mapUser } from '@/lib/api-client';

const commentInputSchema = z.string().trim().min(1, 'Comment cannot be empty').max(500, 'Comment text exceeds 500 characters limit');
const subtaskInputSchema = z.string().trim().min(1, 'Subtask title cannot be empty');
import { useUser } from '@/lib/auth';

import { useTask } from '../api/get-task';
import { useUpdateTask } from '../api/update-task';
import { useDeleteTask } from '../api/delete-task';
import { TaskStatus, TaskPriority, Subtask } from '../types';
import {
  getPriorityLabel,
  getPriorityBadgeStyle,
  getStatusLabel,
  getStatusSelectStyle,
  getUserInitials,
  isTaskOverdue,
} from '../utils/task-utils';

type EditTaskProps = {
  taskId: string;
};

const getStatusModalInfo = (status: number) => {
  switch (status) {
    case TaskStatus.IN_PROGRESS:
      return {
        title: 'Start Work Comment Required',
        prompt: 'Add a note/comment for starting work session *',
        placeholder: 'Enter work session note (e.g. Starting code implementation)...',
        icon: <PlayCircle className="size-6 text-blue-600" />,
        iconBg: 'bg-blue-50',
      };
    case TaskStatus.ON_HOLD:
      return {
        title: 'Reason for Hold Required',
        prompt: 'Why is this item being placed on hold? *',
        placeholder: 'Enter detailed reason for hold (e.g. Waiting for client requirements)...',
        icon: <PauseCircle className="size-6 text-amber-600" />,
        iconBg: 'bg-amber-50',
      };
    case TaskStatus.COMPLETED:
      return {
        title: 'Completion Note Required',
        prompt: 'Add a summary note/comment for completion *',
        placeholder: 'Enter completion details (e.g. All requirements tested and verified)...',
        icon: <CheckCircle className="size-6 text-emerald-600" />,
        iconBg: 'bg-emerald-50',
      };
    case TaskStatus.CANCELLED:
      return {
        title: 'Reason for Blocking Required',
        prompt: 'Why is this item being blocked/cancelled? *',
        placeholder: 'Enter details for blocking or cancelling this task...',
        icon: <AlertCircle className="size-6 text-rose-600" />,
        iconBg: 'bg-rose-50',
      };
    default:
      return {
        title: 'Reason for Moving to To Do Required',
        prompt: 'Why is this item being moved back to To Do? *',
        placeholder: 'Enter details for moving this task back to To Do...',
        icon: <Clock className="size-6 text-slate-600" />,
        iconBg: 'bg-slate-50',
      };
  }
};

export const EditTask = ({ taskId }: EditTaskProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const activityEndRef = useRef<HTMLDivElement>(null);

  // Get active logged in user
  const currentUserQuery = useUser();
  const currentUser = currentUserQuery.data;

  // Fetch current task
  const taskQuery = useTask({ taskId });

  // Fetch active users for reassignment
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = (await api.get('/admin/users', { params: { limit: 100, all: 'true' } })) as { users?: Record<string, unknown>[] };
      return (res.users || []).map(mapUser);
    },
  });

  // Fetch teams for the team dropdown
  const { data: teamsRes = [] } = useQuery<Team[]>({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const res = await api.get('/admin/teams');
      return (Array.isArray(res) ? res : (res as { data?: Team[] })?.data || []) as Team[];
    },
  });

  const updateTaskMutation = useUpdateTask({
    mutationConfig: {
      onSuccess: () => {
        taskQuery.refetch();
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
        navigate(paths.app.tasks.getHref());
      },
    },
  });

  // --- LOCAL INTERACTIVE STATES ---
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [committedDate, setCommittedDate] = useState('');
  const [showReassignMenu, setShowReassignMenu] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedNewAssignees, setSelectedNewAssignees] = useState<string[]>([]);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  // Live Active Session Timer
  const [activeSessionSeconds, setActiveSessionSeconds] = useState<number>(0);

  const task = taskQuery.data;

  useEffect(() => {
    if (task?.status === TaskStatus.IN_PROGRESS && task?.lastStartedAt) {
      const startTime = new Date(task.lastStartedAt).getTime();
      const updateSeconds = () => {
        const diffSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setActiveSessionSeconds(diffSec);
      };
      updateSeconds();
      const interval = setInterval(updateSeconds, 1000);
      return () => clearInterval(interval);
    } else {
      setActiveSessionSeconds(0);
    }
  }, [task?.status, task?.lastStartedAt]);
  // Sub-task list (connected to task query)
  const [subTasks, setSubTasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskStatus, setNewSubtaskStatus] = useState<number>(0);

  const [subtaskSessionSeconds, setSubtaskSessionSeconds] = useState<Record<string, number>>({});

  useEffect(() => {
    const activeSubtasks = subTasks.filter(
      (s) => Number(s.status) === TaskStatus.IN_PROGRESS && s.lastStartedAt,
    );

    if (activeSubtasks.length > 0) {
      const updateSubSeconds = () => {
        const now = Date.now();
        const nextMap: Record<string, number> = {};
        for (const s of activeSubtasks) {
          const sId = s._id || s.id || '';
          if (sId && s.lastStartedAt) {
            const startTime = new Date(s.lastStartedAt).getTime();
            const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
            nextMap[sId] = diffSec;
          }
        }
        setSubtaskSessionSeconds(nextMap);
      };

      updateSubSeconds();
      const interval = setInterval(updateSubSeconds, 1000);
      return () => clearInterval(interval);
    } else {
      setSubtaskSessionSeconds({});
    }
  }, [subTasks]);

  // File upload state
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSubtaskLogs, setExpandedSubtaskLogs] = useState<Record<string, boolean>>({});

  // Status Change Required Comment Modal State
  const [statusModalConfig, setStatusModalConfig] = useState<{
    isOpen: boolean;
    type: 'main' | 'subtask';
    newStatus: number;
    subtaskIndex?: number;
    subtaskTitle?: string;
    comment: string;
    error: string;
  }>({
    isOpen: false,
    type: 'main',
    newStatus: 0,
    comment: '',
    error: '',
  });

  const toggleSubtaskLogs = (subId: string) => {
    setExpandedSubtaskLogs((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  // Refs for outside click detection
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();

  // Permission for reassigning task: Only CEO (0), Manager (1), and TL (2) can reassign tasks
  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const canReassign = currentUser?.role === 0 || currentUser?.role === 1 || currentUser?.role === 2;
  const isEmployee = currentUser?.role === 4;

  // Filter available target assignees for Manager/TL (CEO can assign to all; Manager/TL to all Manager/TL + team members)
  const availableAssignees = useMemo(() => {
    if (!currentUser) return users;
    if (currentUser.role === 0) return users; // CEO can assign to anyone
    if (currentUser.role === 1 || currentUser.role === 2) {
      const teamMemberIds = new Set<string>();
      const currentUserIdStr = String(currentUser._id || currentUser.id || '');

      (teamsRes || []).forEach((t: Team) => {
        const mgrId = typeof t.managerId === 'object' ? (t.managerId as any)?._id || (t.managerId as any)?.id : t.managerId;
        const mgrIdStr = mgrId ? String(mgrId) : '';
        const memberIdStrs = (t.members || []).map((m: any) => typeof m === 'object' ? String(m._id || m.id) : String(m));

        if (mgrIdStr === currentUserIdStr || memberIdStrs.includes(currentUserIdStr)) {
          if (mgrIdStr) teamMemberIds.add(mgrIdStr);
          memberIdStrs.forEach((id) => teamMemberIds.add(id));
        }
      });

      return users.filter((u: User) => {
        const uId = String(u._id || u.id || '');
        const isManagerOrTL = u.role === 0 || u.role === 1 || u.role === 2;
        const isInTeam = teamMemberIds.has(uId);
        const isInSameTeamProp = currentUser.teamId && u.teamId && String(u.teamId) === String(currentUser.teamId);
        return isManagerOrTL || isInTeam || isInSameTeamProp;
      });
    }
    return [];
  }, [users, currentUser, teamsRes]);

  // Initialize values from fetched task
  useEffect(() => {
    if (task) {
      setTempDescription(task.description || '');
      setSubTasks(task.subtasks || []);

      if (task.assignedTo) {
        const raw = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        setSelectedNewAssignees(raw.map((a: unknown) => typeof a === 'string' ? a : (a as { _id?: string; id?: string })?._id || (a as { _id?: string; id?: string })?.id || ''));
      } else {
        setSelectedNewAssignees([]);
      }

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setDate(dueDate.getDate() + 1);
        setCommittedDate(dueDate.toISOString().split('T')[0]);
      }
      if (searchParams.get('reassign') === 'true' && canReassign) {
        setReassignModalOpen(true);
      }
    }
  }, [task, searchParams, canReassign]);

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target as Node)
      ) {
        setShowActionDropdown(false);
      }
    };

    if (showActionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionDropdown]);

  // Auto-scroll to newest activity after posting comment
  const scrollToLatestActivity = useCallback(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (taskQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task || taskQuery.isError) {
    return (
      <div className="text-center py-16 font-bold flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm my-8">
        <AlertCircle className="size-10 text-slate-400" />
        <span className="text-slate-800 text-base font-extrabold">Task Not Accessible</span>
        <p className="text-slate-400 text-xs font-medium max-w-sm">
          This task may have been reassigned to another team member or is no longer accessible to your account.
        </p>
        <button
          onClick={() => navigate(paths.app.tasks.getHref())}
          className="mt-2 rounded-full bg-[#1E3A8A] text-white text-xs font-bold px-6 py-2 hover:bg-[#152a63] transition-colors cursor-pointer"
        >
          Back to Tasks List
        </button>
      </div>
    );
  }

  // Calculate sub-tasks progress rate
  const completedSubtasks = subTasks.filter(s => s.isCompleted).length;
  const progressPercent = subTasks.length > 0
    ? Math.round((completedSubtasks / subTasks.length) * 100)
    : 0;

  // Calculate total time logged including active session (main task + subtasks)
  const totalBaseLoggedMinutes = (task.timeLogs || []).reduce(
    (sum: number, log) => sum + (log.hours || 0) * 60 + (log.minutes || 0),
    0,
  );
  const activeSubtasksSecondsSum = Object.values(subtaskSessionSeconds).reduce((a, b) => a + b, 0);
  const combinedActiveSeconds = activeSessionSeconds + activeSubtasksSecondsSum;
  const activeSessionMinutes = Math.floor(combinedActiveSeconds / 60);
  const totalCombinedMinutes = totalBaseLoggedMinutes + activeSessionMinutes;
  const totalDisplayHours = Math.floor(totalCombinedMinutes / 60);
  const totalDisplayMinutes = totalCombinedMinutes % 60;

  // Extract numeric status & priority values safely (handles both number and { id, label } object)
  const taskStatusNum = typeof task.status === 'object' && task.status !== null ? Number((task.status as any).id ?? 0) : Number(task.status ?? 0);
  const taskPriorityNum = typeof task.priority === 'object' && task.priority !== null ? Number((task.priority as any).id ?? 0) : Number(task.priority ?? 0);

  // Overdue Check — uses live date instead of hardcoded value
  const overdue = isTaskOverdue(taskStatusNum, task.dueDate);

  // Actions
  const executeMainStatusChange = async (newStatus: number) => {
    return updateTaskMutation.mutateAsync({
      taskId,
      data: { status: newStatus },
    });
  };

  const handleStatusChange = (newStatus: number) => {
    setStatusModalConfig({
      isOpen: true,
      type: 'main',
      newStatus,
      comment: '',
      error: '',
    });
  };

  const handlePriorityChange = (newPriority: number) => {
    updateTaskMutation.mutate({
      taskId,
      data: { priority: newPriority },
    });
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTaskMutation.mutate({
      taskId,
      data: { dueDate: e.target.value },
    });
  };

  const handleDescriptionSave = () => {
    updateTaskMutation.mutate({
      taskId,
      data: { description: tempDescription },
    });
    setIsEditingDescription(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = commentInputSchema.safeParse(commentInput);
    if (!result.success) {
      addNotification({
        type: 'error',
        title: result.error.errors[0]?.message || 'Invalid comment content',
      });
      return;
    }
    if (isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: result.data });
      setCommentInput('');
      await taskQuery.refetch();
      addNotification({
        type: 'success',
        title: 'Comment added successfully',
      });
      // Scroll to the latest comment
      setTimeout(scrollToLatestActivity, 100);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to add comment',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const checkSubtaskPermission = (sub: Subtask) => {
    if (!isEmployee) return true;
    const subAssignee = sub.assignedTo ? String(sub.assignedTo) : null;
    const taskAssignees = Array.isArray(task?.assignedTo) ? task.assignedTo.map(String) : (task?.assignedTo ? [String(task.assignedTo)] : []);
    const creatorId = task?.createdBy ? String(task.createdBy) : null;

    if (subAssignee === currentUserId || taskAssignees.includes(currentUserId) || creatorId === currentUserId) {
      return true;
    }
    return false;
  };

  const handleToggleSubtask = (subId: string, index: number) => {
    const targetSub = subTasks[index];
    if (targetSub && !checkSubtaskPermission(targetSub)) {
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only the user assigned to this subtask or task can update it',
      });
      return;
    }

    const id = subId || `subtask-${index}`;
    const updated = subTasks.map((sub, idx) => {
      if (sub._id === id || idx === index) {
        const nextCompleted = !sub.isCompleted;
        const nextStatus = nextCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING;
        return { ...sub, isCompleted: nextCompleted, status: nextStatus };
      }
      return sub;
    });
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
  };

  const executeSubtaskStatusChange = async (index: number, newStatus: number) => {
    const nextCompleted = newStatus === TaskStatus.COMPLETED;
    const updated = subTasks.map((sub, idx) =>
      idx === index ? { ...sub, status: newStatus, isCompleted: nextCompleted } : sub
    );
    setSubTasks(updated);
    return updateTaskMutation.mutateAsync({
      taskId,
      data: { subtasks: updated },
    });
  };

  const handleSubtaskStatusChange = (index: number, newStatus: number) => {
    const targetSub = subTasks[index];
    if (targetSub && !checkSubtaskPermission(targetSub)) {
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only the user assigned to this subtask or task can update it',
      });
      return;
    }

    if (isEmployee && newStatus !== TaskStatus.IN_PROGRESS && newStatus !== TaskStatus.ON_HOLD) {
      addNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Employees can only change subtask status to In Progress or Hold',
      });
      return;
    }

    setStatusModalConfig({
      isOpen: true,
      type: 'subtask',
      newStatus,
      subtaskIndex: index,
      subtaskTitle: targetSub?.title || 'Subtask',
      comment: '',
      error: '',
    });
  };

  const handleConfirmStatusComment = async () => {
    const trimmed = statusModalConfig.comment.trim();
    if (!trimmed) {
      setStatusModalConfig((prev) => ({
        ...prev,
        error: 'A comment/reason is required for this status change',
      }));
      return;
    }

    const { type, newStatus, subtaskIndex, subtaskTitle } = statusModalConfig;
    setStatusModalConfig((prev) => ({ ...prev, isOpen: false }));

    const statusLabels: Record<number, string> = {
      [TaskStatus.PENDING]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.COMPLETED]: 'Completed',
      [TaskStatus.CANCELLED]: 'Blocked',
      [TaskStatus.ON_HOLD]: 'Hold',
    };
    const statusLabel = statusLabels[newStatus] || 'New Status';

    try {
      if (type === 'main') {
        await executeMainStatusChange(newStatus);
        await api.post(`/tasks/${taskId}/comments`, {
          content: `[Status: ${statusLabel}] ${trimmed}`,
        });
      } else if (type === 'subtask' && subtaskIndex !== undefined) {
        await executeSubtaskStatusChange(subtaskIndex, newStatus);
        await api.post(`/tasks/${taskId}/comments`, {
          content: `[Subtask: ${subtaskTitle || 'Subtask'} - ${statusLabel}] ${trimmed}`,
        });
      }
      await taskQuery.refetch();
      setTimeout(scrollToLatestActivity, 150);
      addNotification({
        type: 'success',
        title: 'Status updated & comment added',
      });
    } catch (err) {
      console.error('Failed to update status or post comment:', err);
      addNotification({
        type: 'error',
        title: 'Failed to update status or add comment',
      });
      taskQuery.refetch();
    }
  };

  const handleSubtaskAssigneeChange = (index: number, newAssigneeId: string) => {
    if (isEmployee) return;
    const updated = subTasks.map((sub, idx) =>
      idx === index ? { ...sub, assignedTo: newAssigneeId || undefined } : sub
    );
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
  };

  const handleSubtaskDueDateChange = (index: number, dueDate: string) => {
    if (isEmployee) return;
    const updated = subTasks.map((sub, idx) =>
      idx === index ? { ...sub, dueDate: dueDate || undefined } : sub
    );
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
  };

  const handleCreateSubtask = () => {
    if (isEmployee) return;
    const result = subtaskInputSchema.safeParse(newSubtaskTitle);
    if (!result.success) {
      addNotification({
        type: 'error',
        title: result.error.errors[0]?.message || 'Invalid subtask title',
      });
      return;
    }
    const isComp = newSubtaskStatus === TaskStatus.COMPLETED;
    const updated: Subtask[] = [
      ...subTasks,
      {
        title: result.data,
        isCompleted: isComp,
        status: newSubtaskStatus,
        assignedTo: newSubtaskAssignee || undefined,
        dueDate: newSubtaskDueDate || undefined,
      },
    ];
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setNewSubtaskDueDate('');
    setNewSubtaskStatus(0);
    setIsAddingSubtask(false);
  };

  const handleDeleteSubtask = (index: number) => {
    if (isEmployee) return;
    const updated = subTasks.filter((_, idx) => idx !== index);
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
      }

      const res = await api.post('/file/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedFiles = Array.isArray(res) ? res : ((res as { data?: unknown[] })?.data || []);
      if (uploadedFiles && uploadedFiles.length > 0) {
        const rawAttachments = [...(task.attachments || []), ...uploadedFiles];
        const newAttachments = rawAttachments.map((att: unknown) => {
          const a = att as { originalName: string; filename: string; mimetype?: string; size?: number; path: string; url: string };
          return {
            originalName: a.originalName,
            filename: a.filename,
            mimetype: a.mimetype,
            size: a.size,
            path: a.path,
            url: a.url,
          };
        });
        await api.patch(`/tasks/${taskId}`, { attachments: newAttachments });
        taskQuery.refetch();
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to upload files',
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (filename: string) => {
    try {
      const rawAttachments = (task.attachments || []).filter(
        (att) => att.filename !== filename
      );
      const newAttachments = rawAttachments.map((att) => ({
        originalName: att.originalName,
        filename: att.filename,
        mimetype: att.mimetype,
        size: att.size,
        path: att.path,
        url: att.url,
      }));
      await api.patch(`/tasks/${taskId}`, { attachments: newAttachments });
      taskQuery.refetch();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to delete attachment',
      });
    }
  };

  const handleReassignUser = (userIds: string[]) => {
    const isEmployee = currentUser?.role === 4;

    updateTaskMutation.mutate(
      {
        taskId,
        data: { assignedTo: userIds },
      },
      {
        onSuccess: () => {
          if (isEmployee) {
            navigate(paths.app.tasks.getHref());
          } else {
            taskQuery.refetch();
          }
        },
      },
    );
    setShowReassignMenu(false);
    setReassignModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

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
          <span className="text-slate-700">Task Detail</span>
        </div>

        <button
          onClick={() => navigate(paths.app.tasks.getHref())}
          className="flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-[#0EA5E9] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to list
        </button>
      </div>

      {/* Main Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

        {/* Left Column (approx 58% width) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Title and Header Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm relative space-y-4 animate-card-enter">

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {task.title}
                </h1>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Selector Dropdown */}
                  <select
                    value={taskStatusNum}
                    onChange={(e) => handleStatusChange(Number(e.target.value))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm focus:outline-none transition-all cursor-pointer ${getStatusSelectStyle(taskStatusNum)}`}
                  >
                    {isEmployee ? (
                      <>
                        {taskStatusNum !== TaskStatus.IN_PROGRESS && taskStatusNum !== TaskStatus.ON_HOLD && (
                          <option value={taskStatusNum} disabled>
                            {getStatusLabel(taskStatusNum)}
                          </option>
                        )}
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.ON_HOLD}>Hold</option>
                      </>
                    ) : (
                      <>
                        <option value={TaskStatus.PENDING}>To Do</option>
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.ON_HOLD}>Hold</option>
                        <option value={TaskStatus.COMPLETED}>Completed</option>
                        <option value={TaskStatus.CANCELLED}>Blocked</option>
                      </>
                    )}
                  </select>

                  {/* Priority Selector Dropdown */}
                  {isEmployee ? (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${getPriorityBadgeStyle(taskPriorityNum)}`}>
                      {getPriorityLabel(taskPriorityNum)}
                    </span>
                  ) : (
                    <select
                      value={taskPriorityNum}
                      onChange={(e) => handlePriorityChange(Number(e.target.value))}
                      className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm focus:outline-none transition-all cursor-pointer ${getPriorityBadgeStyle(taskPriorityNum)}`}
                    >
                      <option value={TaskPriority.LOW}>Low Priority</option>
                      <option value={TaskPriority.MEDIUM}>Medium Priority</option>
                      <option value={TaskPriority.HIGH}>High Priority</option>
                    </select>
                  )}

                  {/* Overdue indicator */}
                  {overdue && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                      <AlertCircle className="size-3" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Three-Dot Actions Dropdown */}
              <div className="relative" ref={actionDropdownRef}>
                <button
                  onClick={() => setShowActionDropdown(!showActionDropdown)}
                  className="p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <MoreHorizontal className="size-5.5" />
                </button>

                {showActionDropdown && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1 animate-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowActionDropdown(false);
                        setIsEditingDescription(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="size-4" />
                      Edit Description
                    </button>
                    {canReassign && (
                      <button
                        onClick={() => {
                          setShowActionDropdown(false);
                          setReassignModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <UserCheck className="size-4" />
                        Reassign Task
                      </button>
                    )}
                    {currentUser?.role !== 4 && (
                      <>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => {
                            setShowActionDropdown(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="size-4" />
                          Delete Task
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description Text block */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>

              {isEditingDescription ? (
                <div className="space-y-3 mt-1.5">
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    rows={5}
                    placeholder="Provide detailed description..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setIsEditingDescription(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescriptionSave}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#152a63] cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {task.description || 'No description provided. Click the edit description menu to add one.'}
                  </p>
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="absolute right-0 top-0 size-7 items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors hidden group-hover:flex cursor-pointer"
                    title="Edit Description"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* File Attachments Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 animate-card-enter">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="size-4.5 text-slate-400" />
                Attachments
                {task.attachments && task.attachments.length > 0 && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-extrabold ml-1">
                    {task.attachments.length}
                  </span>
                )}
              </h3>
              <label className="text-[10px] font-bold text-[#1E3A8A] hover:text-[#0EA5E9] cursor-pointer flex items-center gap-1">
                {isUploadingFile ? (
                  <span className="flex items-center gap-1">
                    <Spinner size="sm" />
                    Uploading...
                  </span>
                ) : (
                  <>
                    <span>+ Add File</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingFile}
                    />
                  </>
                )}
              </label>
            </div>

            {task.attachments && task.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {task.attachments.map((att) => (
                  <div
                    key={att.filename}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-left hover:bg-slate-100/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="size-5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-slate-700 hover:text-[#1E3A8A] hover:underline block truncate"
                          title={att.originalName}
                        >
                          {att.originalName}
                        </a>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {att.size ? `${(att.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAttachment(att.filename)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Delete attachment"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                No attachments uploaded yet
              </div>
            )}
          </div>

          {/* Activity & Comments Feed */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col h-[400px] animate-card-enter">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="size-4.5 text-slate-400" />
                Activity & Comments
                {task.activities && task.activities.length > 0 && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-extrabold ml-1">
                    {task.activities.length}
                  </span>
                )}
              </h3>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
              {(task?.activities || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="size-8 mb-2 opacity-40" />
                  <span className="text-xs font-medium">No activity yet</span>
                  <span className="text-[10px] font-medium mt-0.5">Post a comment to start the conversation</span>
                </div>
              ) : (
                (task?.activities || []).map((act, idx: number) => {
                  const isSystem = act.type === 'system';
                  return (
                    <div key={act._id || idx} className="flex gap-3 items-start text-xs text-left animate-fade-up">
                      <div className={`size-7.5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${isSystem ? 'bg-slate-100 text-slate-500' : 'bg-sky-50 text-[#0EA5E9]'
                        }`}>
                        {act.userInitials || 'SO'}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{act.userName}</span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="size-3" />
                            {new Date(act.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {isSystem ? (
                          <p className="text-slate-400 italic font-medium">{act.content}</p>
                        ) : (
                          <p className="text-slate-600 bg-slate-50/50 border border-slate-100/50 p-2.5 rounded-xl leading-relaxed font-semibold">
                            {act.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={activityEndRef} />
            </div>

            {/* Fixed comment input box */}
            <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-3 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Write a comment, press enter to post..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-indigo-500/10 font-medium transition-all"
                  disabled={isSubmittingComment}
                />
                {commentInput.length > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                    {commentInput.length}/500
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmittingComment || !commentInput.trim()}
                className="p-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a63] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? <Spinner size="sm" /> : <Send className="size-4" />}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (approx 42% width) - Details card & Sub-tasks */}
        <div className="lg:col-span-5 space-y-6">

          {/* Details Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left animate-card-enter">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Details Overview</h3>
            </div>

            <div className="space-y-3.5 text-xs">

              {/* Client Info */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Client</span>
                <span className="font-semibold text-slate-800 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-[11px] border border-indigo-100">
                  {task.clientInfo?.name || 'N/A'}{task.clientInfo?.companyName ? ` (${task.clientInfo.companyName})` : ''}
                </span>
              </div>

              {/* Assigned By */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Assigned By</span>
                <div className="flex items-center gap-2">
                  <div className="size-6.5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {getUserInitials(
                      task.creatorInfo?.firstName,
                      task.creatorInfo?.lastName,
                    )}
                  </div>
                  <span className="font-semibold text-slate-700">
                    {task.creatorInfo
                      ? `${task.creatorInfo.firstName} ${task.creatorInfo.lastName}`
                      : 'System'}
                  </span>
                </div>
              </div>

              {/* Assigned To */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50 relative">
                <span className="text-slate-400 font-bold">Assigned To</span>

                {showReassignMenu ? (
                  <select
                    onChange={(e) => handleReassignUser(e.target.value ? [e.target.value] : [])}
                    onBlur={() => setShowReassignMenu(false)}
                    defaultValue={typeof task.assignedTo === 'string' ? task.assignedTo : ''}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold text-slate-700"
                    autoFocus
                  >
                    <option value="">Unassigned</option>
                    {availableAssignees.map((u: User) => (
                      <option key={u.id || u._id} value={u.id || u._id}>
                        {u.firstName} {u.lastName} ({u.department ? u.department : (u.role === 4 ? 'Employee' : u.role === 1 ? 'Manager' : u.role === 2 ? 'TL' : 'User')})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    onClick={() => {
                      if (canReassign) {
                        setReassignModalOpen(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent transition-colors ${canReassign ? 'hover:bg-slate-50 hover:border-slate-100 cursor-pointer' : ''
                      }`}
                  >
                    {task.assigneeInfo ? (
                      (() => {
                        const assignees = Array.isArray(task.assigneeInfo) ? task.assigneeInfo : [task.assigneeInfo];
                        if (assignees.length === 0) return <span className="text-slate-400 font-medium italic">Unassigned</span>;
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {assignees.map((u: { firstName: string; lastName: string }, idx: number) => (
                              <span key={idx} className="inline-flex items-center gap-1 bg-sky-50 text-[#0EA5E9] px-2.5 py-0.5 rounded-full text-xs font-bold border border-sky-100">
                                {u.firstName} {u.lastName}
                              </span>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-slate-400 font-medium italic">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Deadline Date</span>
                <input
                  type="date"
                  defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={handleDeadlineChange}
                  className={`bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold ${overdue ? 'text-rose-600 border-rose-300 font-extrabold' : 'text-slate-700'
                    }`}
                />
              </div>

              {/* Committed Date (ETA) */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Committed ETA</span>
                <input
                  type="date"
                  value={committedDate}
                  onChange={(e) => setCommittedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold text-slate-700"
                />
              </div>

              {/* Created Date */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Created Date</span>
                <span className="font-semibold text-slate-600">
                  {new Date(task.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Subtask Progression</span>
                  <span className="text-slate-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Sub-tasks checklist section */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left animate-card-enter">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="size-4.5 text-slate-400" />
                Sub-tasks Checklist
              </h3>
              <span className="text-[10px] font-bold text-[#0EA5E9] bg-sky-50 px-2 py-0.5 rounded-full">
                {completedSubtasks}/{subTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {subTasks.map((sub, index) => {
                const subId = sub._id || sub.id || `subtask-${index}`;
                const subStatusNum = sub.status !== undefined ? Number(sub.status) : (sub.isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING);
                const subAssigneeId = typeof sub.assignedTo === 'string' ? sub.assignedTo : sub.assignedToInfo?._id || '';

                return (
                  <div
                    key={subId}
                    className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 group text-xs transition-colors hover:bg-slate-100/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          disabled={isEmployee}
                          onChange={() => !isEmployee && handleToggleSubtask(subId, index)}
                          className={`rounded border-slate-300 text-[#1E3A8A] focus:ring-blue-900/10 shrink-0 ${isEmployee ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        />
                        <span
                          className={`font-semibold text-slate-800 truncate ${isEmployee ? 'cursor-default' : 'cursor-pointer'} ${sub.isCompleted ? 'line-through text-slate-400' : ''}`}
                          onClick={() => !isEmployee && handleToggleSubtask(subId, index)}
                          title={sub.title}
                        >
                          {sub.title}
                        </span>
                      </div>

                      {/* Status Dropdown Pill */}
                      <select
                        value={subStatusNum}
                        onChange={(e) => handleSubtaskStatusChange(index, Number(e.target.value))}
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs focus:outline-none cursor-pointer ${subStatusNum === 1 ? 'bg-sky-50 text-[#0EA5E9] border-sky-200' :
                          subStatusNum === 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            subStatusNum === 3 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                              subStatusNum === 4 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {isEmployee ? (
                          <>
                            {subStatusNum !== TaskStatus.IN_PROGRESS && subStatusNum !== TaskStatus.ON_HOLD && (
                              <option value={subStatusNum} disabled>
                                {getStatusLabel(subStatusNum)}
                              </option>
                            )}
                            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                            <option value={TaskStatus.ON_HOLD}>Hold</option>
                          </>
                        ) : (
                          <>
                            <option value={TaskStatus.PENDING}>To Do</option>
                            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                            <option value={TaskStatus.COMPLETED}>Completed</option>
                            <option value={TaskStatus.ON_HOLD}>Hold</option>
                            <option value={TaskStatus.CANCELLED}>Blocked</option>
                          </>
                        )}
                      </select>

                      {!isEmployee && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubtask(index);
                          }}
                          className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-0.5 shrink-0 cursor-pointer"
                          title="Remove subtask"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Subtask Assignee and Due Date row */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1 border-t border-slate-200/50">
                      {/* Assignee select */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-bold">Assign:</span>
                        {isEmployee ? (
                          <span className="font-semibold text-slate-700 text-[10px]">
                            {(() => {
                              const found = users.find((u: User) => (u.id || u._id) === subAssigneeId);
                              return found ? `${found.firstName} ${found.lastName}` : (sub.assignedToInfo ? `${sub.assignedToInfo.firstName || ''} ${sub.assignedToInfo.lastName || ''}`.trim() : 'Unassigned');
                            })()}
                          </span>
                        ) : (
                          <select
                            value={subAssigneeId}
                            onChange={(e) => handleSubtaskAssigneeChange(index, e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-700 focus:outline-none focus:border-[#1E3A8A] text-[10px]"
                          >
                            <option value="">Unassigned</option>
                            {availableAssignees.map((u: User) => (
                              <option key={u.id || u._id} value={u.id || u._id}>
                                {u.firstName} {u.lastName}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Due Date picker */}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-slate-400 font-bold">Due:</span>
                        {isEmployee ? (
                          <span className="font-semibold text-slate-700 text-[10px]">
                            {sub.dueDate ? new Date(sub.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                          </span>
                        ) : (
                          <input
                            type="date"
                            value={sub.dueDate ? new Date(sub.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleSubtaskDueDateChange(index, e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-700 focus:outline-none focus:border-[#1E3A8A] text-[10px]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Live Active Session, Total Logged Time, and Subtask Work History Logs display */}
                    {((subStatusNum === TaskStatus.IN_PROGRESS && sub.lastStartedAt) || (sub.totalTimeSpent && (sub.totalTimeSpent.hours > 0 || sub.totalTimeSpent.minutes > 0)) || (sub.timeLogs && sub.timeLogs.length > 0)) ? (
                      <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/40 text-[10px]">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {subStatusNum === TaskStatus.IN_PROGRESS && sub.lastStartedAt ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span>
                                Live: {Math.floor((subtaskSessionSeconds[subId] || 0) / 3600)}h {Math.floor(((subtaskSessionSeconds[subId] || 0) % 3600) / 60)}m {(subtaskSessionSeconds[subId] || 0) % 60}s
                              </span>
                            </div>
                          ) : <div />}

                          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                            {sub.totalTimeSpent && (sub.totalTimeSpent.hours > 0 || sub.totalTimeSpent.minutes > 0) ? (
                              <span className="font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                ⏱️ Logged: {sub?.totalTimeSpent?.formatted}
                              </span>
                            ) : null}

                            {sub?.timeLogs && sub?.timeLogs?.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleSubtaskLogs(subId)}
                                className="font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                {expandedSubtaskLogs[subId] ? 'Hide Logs' : `Logs (${sub.timeLogs.length})`}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Detailed Subtask Time Logs Breakdown */}
                        {sub.timeLogs && sub.timeLogs.length > 0 && expandedSubtaskLogs[subId] && (
                          <div className="mt-1 space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                            <span className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider block border-b border-slate-100 pb-1">
                              Subtask Work Logs ({sub.timeLogs.length})
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pt-1">
                              {sub.timeLogs.map((log: any, lIdx: number) => (
                                <div key={log._id || lIdx} className="flex items-center justify-between gap-2 text-[10px] bg-slate-50 p-2 rounded-md border border-slate-100">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-800">{log.userName || 'User'}</span>
                                      <span className="text-[9px] text-slate-400 font-medium">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                    {log.description && (
                                      <span className="text-[9.5px] text-slate-500 italic font-medium">{log.description}</span>
                                    )}
                                  </div>
                                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[9.5px] border border-emerald-200 shrink-0">
                                    {log.hours}h {log.minutes}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {!isEmployee && (
              isAddingSubtask ? (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl pt-3">
                  <input
                    type="text"
                    placeholder="Enter subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateSubtask();
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-700 transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2 flex-wrap items-center">
                    <select
                      value={newSubtaskAssignee}
                      onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1E3A8A]"
                    >
                      <option value="">Assign Subtask User (Optional)</option>
                      {availableAssignees.map((u: User) => (
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
                    <select
                      value={newSubtaskStatus}
                      onChange={(e) => setNewSubtaskStatus(Number(e.target.value))}
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:border-[#1E3A8A]"
                    >
                      <option value={TaskStatus.PENDING}>To Do</option>
                      <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                      <option value={TaskStatus.COMPLETED}>Completed</option>
                      <option value={TaskStatus.ON_HOLD}>Hold</option>
                      <option value={TaskStatus.CANCELLED}>Blocked</option>
                    </select>
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSubtask(false);
                          setNewSubtaskTitle('');
                        }}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateSubtask}
                        className="px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        + Add Subtask
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-lg text-[11px] border border-slate-200/50 hover:border-slate-300 transition-colors cursor-pointer text-center block"
                >
                  + Add Subtask Item
                </button>
              )
            )}
          </div>

          {/* Time Tracking Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left animate-card-enter">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="size-4.5 text-slate-400" />
                Time Tracking
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Total: {totalDisplayHours}h {totalDisplayMinutes}m
              </span>
            </div>

            {/* Active Session Banner if status is In Progress */}
            {taskStatusNum === TaskStatus.IN_PROGRESS && task.lastStartedAt && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-card-enter">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    In Progress (Live Session)
                  </span>
                </div>
                <span className="text-xs font-extrabold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  {Math.floor(activeSessionSeconds / 3600)}h {Math.floor((activeSessionSeconds % 3600) / 60)}m {activeSessionSeconds % 60}s
                </span>
              </div>
            )}

            {/* List of Time Logs */}
            {task.timeLogs && task.timeLogs.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {task.timeLogs.map((log, idx: number) => (
                  <div key={log._id || idx} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{log.userName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-slate-500 italic font-medium">{log.description}</p>
                      )}
                    </div>
                    <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {log.hours}h {log.minutes}m
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-slate-400 text-xs font-medium">
                No time logged yet
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Delete Task Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800">Delete Task?</h3>
              <p className="text-xs text-slate-500 font-medium">Are you sure you want to permanently delete this task?</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  deleteTaskMutation.mutate({ taskId });
                }}
                disabled={deleteTaskMutation.isPending}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 disabled:opacity-50"
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Task Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Reassign Task</h3>
                  <p className="text-xs text-slate-400 font-medium">Select an employee or manager to reassign this task to</p>
                </div>
              </div>
              <button
                onClick={() => setReassignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Assignees (Select Multiple Users)
              </label>

              {/* Selected Assignees Badges */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                {selectedNewAssignees.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">No assignees selected (Unassigned)</span>
                ) : (
                  selectedNewAssignees.map((id) => {
                    const u = users.find((user: User) => (user.id || user._id) === id);
                    if (!u) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 bg-[#1E3A8A] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs"
                      >
                        {u.firstName} {u.lastName}
                        <button
                          type="button"
                          onClick={() => setSelectedNewAssignees(selectedNewAssignees.filter((aId) => aId !== id))}
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
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-white">
                {availableAssignees.length === 0 ? (
                  <span className="text-slate-400 text-xs italic block p-1">No assignees available</span>
                ) : (
                  availableAssignees.map((u: User) => {
                    const uId = u.id || u._id || '';
                    const isSelected = selectedNewAssignees.includes(uId);
                    const roleBadge = u.role === 0 ? 'CEO' : u.role === 1 ? 'Manager' : u.role === 2 ? 'TL' : 'Employee';
                    return (
                      <label
                        key={uId}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/80 border border-indigo-200 text-[#1E3A8A]' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNewAssignees([...selectedNewAssignees, uId]);
                              } else {
                                setSelectedNewAssignees(selectedNewAssignees.filter((id) => id !== uId));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{u.firstName} {u.lastName} <span className="text-slate-400 font-normal">({u.email})</span></span>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${u.role === 1 ? 'bg-purple-100 text-purple-700' : u.role === 2 ? 'bg-blue-100 text-blue-700' : u.role === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {roleBadge}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReassignUser(selectedNewAssignees);
                  setReassignModalOpen(false);
                }}
                disabled={updateTaskMutation.isPending}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0 disabled:opacity-50"
              >
                {updateTaskMutation.isPending ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Required Comment Modal */}
      {statusModalConfig.isOpen && (() => {
        const modalInfo = getStatusModalInfo(statusModalConfig.newStatus);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-2xl ${modalInfo.iconBg}`}>
                    {modalInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {modalInfo.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {statusModalConfig.type === 'subtask'
                        ? `Subtask: ${statusModalConfig.subtaskTitle}`
                        : 'Main Task Status Update'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalConfig((prev) => ({ ...prev, isOpen: false }))}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {modalInfo.prompt}
                </label>
                <textarea
                  value={statusModalConfig.comment}
                  onChange={(e) =>
                    setStatusModalConfig((prev) => ({
                      ...prev,
                      comment: e.target.value,
                      error: '',
                    }))
                  }
                  placeholder={modalInfo.placeholder}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  autoFocus
                />
                {statusModalConfig.error && (
                  <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    {statusModalConfig.error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalConfig((prev) => ({ ...prev, isOpen: false }))}
                  className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmStatusComment}
                  className={`rounded-xl text-white font-bold shadow-sm transition-all ${statusModalConfig.newStatus === TaskStatus.ON_HOLD
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  Submit & Change Status
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
