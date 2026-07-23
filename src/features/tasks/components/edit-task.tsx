import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { api, mapUser } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { useTask } from '../api/get-task';
import { useUpdateTask } from '../api/update-task';
import { useDeleteTask } from '../api/delete-task';
import { useLogTime } from '../api/log-time';
import { TaskStatus, TaskPriority } from '../types';

type EditTaskProps = {
  taskId: string;
};

export const EditTask = ({ taskId }: EditTaskProps) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // Get active logged in user
  const currentUserQuery = useUser();
  const currentUser = currentUserQuery.data;

  // Fetch current task
  const taskQuery = useTask({ taskId });

  // Fetch active users for reassignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { limit: 100 } }) as any;
      return (res.users || []).map(mapUser);
    },
  });

  // Fetch teams for the team dropdown
  const { data: teamsRes = [] } = useQuery({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const res = await api.get('/admin/teams') as any;
      return res.data || res || [];
    },
  });

  const updateTaskMutation = useUpdateTask({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Task details updated',
        });
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

  const logTimeMutation = useLogTime({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Time logged successfully',
        });
        setIsLoggingTime(false);
        setLogHours(0);
        setLogMinutes(0);
        setLogDescription('');
        taskQuery.refetch();
      },
    },
  });

  // --- LOCAL INTERACTIVE STATES ---
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [logHours, setLogHours] = useState<number>(0);
  const [logMinutes, setLogMinutes] = useState<number>(0);
  const [logDescription, setLogDescription] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [committedDate, setCommittedDate] = useState('2026-07-25');
  const [showReassignMenu, setShowReassignMenu] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  // Tags state
  const [tagsInput, setTagsInput] = useState('');
  const [isEditingTags, setIsEditingTags] = useState(false);

  // File upload state
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Sub-task list (connected to task query)
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const task = taskQuery.data;

  // Initialize values from fetched task
  useEffect(() => {
    if (task) {
      setTempDescription(task.description || '');
      setSubTasks(task.subtasks || []);
      setTagsInput(task.tags?.join(', ') || '');
    }
  }, [task]);

  if (taskQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center text-red-500 py-12 font-bold flex flex-col items-center gap-2">
        <AlertCircle className="size-8" />
        Task not found
      </div>
    );
  }

  // Calculate sub-tasks progress rate
  const completedSubtasks = subTasks.filter(s => s.isCompleted).length;
  const progressPercent = subTasks.length > 0
    ? Math.round((completedSubtasks / subTasks.length) * 100)
    : 0;

  // Calculate total time logged
  const totalMinutes = (task.timeLogs || []).reduce((acc, log) => acc + (log.hours * 60) + log.minutes, 0);
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  // Overdue Check
  const isOverdue = () => {
    if (task.status === TaskStatus.COMPLETED) return false;
    if (!task.dueDate) return false;
    const deadline = new Date(task.dueDate);
    const today = new Date('2026-07-20');
    return deadline < today;
  };

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
        return 'bg-red-50 text-red-700 border-red-200';
      case TaskPriority.MEDIUM:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'Done';
      case TaskStatus.IN_PROGRESS: return 'In Progress';
      case TaskStatus.CANCELLED: return 'Blocked';
      default: return 'To Do';
    }
  };

  const getStatusSelectStyle = (s: number) => {
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

  // Actions
  const handleStatusChange = (newStatus: number) => {
    updateTaskMutation.mutate({
      taskId,
      data: { status: newStatus },
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
    if (!commentInput.trim()) return;

    try {
      await api.post(`/tasks/${taskId}/comments`, { content: commentInput.trim() });
      setCommentInput('');
      taskQuery.refetch();
      addNotification({
        type: 'success',
        title: 'Comment added successfully',
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Failed to add comment',
      });
    }
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = subTasks.map(sub =>
      (sub._id === subId || sub.id === subId) ? { ...sub, isCompleted: !sub.isCompleted } : sub
    );
    setSubTasks(updated);
    updateTaskMutation.mutate({
      taskId,
      data: { subtasks: updated },
    });
  };

  const handleCreateSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const updated = [...subTasks, { title: newSubtaskTitle.trim(), isCompleted: false }];
      setSubTasks(updated);
      updateTaskMutation.mutate({
        taskId,
        data: { subtasks: updated },
      });
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleTagsSave = () => {
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    
    updateTaskMutation.mutate({
      taskId,
      data: { tags: parsedTags },
    });
    setIsEditingTags(false);
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
      }) as any;

      const uploadedFiles = Array.isArray(res) ? res : (res?.data || []);
      if (uploadedFiles && uploadedFiles.length > 0) {
        const rawAttachments = [...(task.attachments || []), ...uploadedFiles];
        const newAttachments = rawAttachments.map((att: any) => ({
          originalName: att.originalName,
          filename: att.filename,
          mimetype: att.mimetype,
          size: att.size,
          path: att.path,
          url: att.url,
        }));
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
        (att: any) => att.filename !== filename
      );
      const newAttachments = rawAttachments.map((att: any) => ({
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

  const handleReassignUser = (userId: string) => {
    updateTaskMutation.mutate({
      taskId,
      data: { assignedTo: userId || undefined },
    });
    setShowReassignMenu(false);
  };

  const handleUpdateTeam = (teamId: string) => {
    updateTaskMutation.mutate({
      taskId,
      data: { teamId: teamId || undefined },
    });
    setShowTeamMenu(false);
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
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm relative space-y-4">
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {task.title}
                </h1>
                
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Selector Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(Number(e.target.value))}
                    className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm focus:outline-none transition-all cursor-pointer ${getStatusSelectStyle(task.status)}`}
                  >
                    <option value={TaskStatus.PENDING}>To Do</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.COMPLETED}>Done</option>
                    <option value={TaskStatus.CANCELLED}>Blocked</option>
                  </select>

                  {/* Priority pill */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityBadgeStyle(task.priority)}`}>
                    {getPriorityLabel(task.priority)} Priority
                  </span>
                </div>
              </div>

              {/* Three-Dot Actions Dropdown */}
              <div className="relative">
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
                    {currentUser?.role !== 4 && (
                      <>
                        <button
                          onClick={() => {
                            setShowActionDropdown(false);
                            setShowReassignMenu(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <UserCheck className="size-4" />
                          Reassign Task
                        </button>
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
                    className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A]"
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
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="size-4.5 text-slate-400" />
                Attachments
              </h3>
              <label className="text-[10px] font-bold text-[#1E3A8A] hover:text-[#0EA5E9] cursor-pointer flex items-center gap-1">
                {isUploadingFile ? (
                  <span>Uploading...</span>
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
                {task.attachments.map((att: any) => (
                  <div
                    key={att.filename}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-left"
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
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
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
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col h-[400px]">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="size-4.5 text-slate-400" />
                Activity & Comments
              </h3>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1.5">
              {(task?.activities || []).map((act: any, idx: number) => {
                const isSystem = act.type === 'system';
                return (
                  <div key={act._id || idx} className="flex gap-3 items-start text-xs text-left">
                    <div className={`size-7.5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                      isSystem ? 'bg-slate-100 text-slate-500' : 'bg-sky-50 text-[#0EA5E9]'
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
              })}
            </div>

            {/* Fixed comment input box */}
            <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment, press enter to post..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1E3A8A] font-medium"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a63] text-white transition-colors"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column (approx 42% width) - Details card & Sub-tasks */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Details Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Details Overview</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Assigned By */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Assigned By</span>
                <div className="flex items-center gap-2">
                  <div className="size-6.5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {task.creatorInfo
                      ? `${task.creatorInfo.firstName?.[0] || ''}${task.creatorInfo.lastName?.[0] || ''}`.toUpperCase()
                      : 'SO'}
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
                    onChange={(e) => handleReassignUser(e.target.value)}
                    onBlur={() => setShowReassignMenu(false)}
                    defaultValue={task.assignedTo || ''}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold text-slate-700"
                    autoFocus
                  >
                    <option value="">Unassigned</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    onClick={() => setShowReassignMenu(true)}
                    className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                  >
                    {task.assigneeInfo ? (
                      <>
                        <div className="size-6.5 rounded-full bg-sky-50 text-[#0EA5E9] font-bold flex items-center justify-center text-[10px]">
                          {task.assigneeInfo.firstName?.[0]}
                        </div>
                        <span className="font-semibold text-slate-700">
                          {task.assigneeInfo.firstName} {task.assigneeInfo.lastName}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Team */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50 relative">
                <span className="text-slate-400 font-bold">Team</span>
                
                {showTeamMenu && (currentUser?.role === 0 || currentUser?.role === 1) ? (
                  <select
                    onChange={(e) => handleUpdateTeam(e.target.value)}
                    onBlur={() => setShowTeamMenu(false)}
                    defaultValue={task.teamId || ''}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold text-slate-700"
                    autoFocus
                  >
                    <option value="">No Team (Independent)</option>
                    {teamsRes.map((t: any) => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    onClick={() => {
                      if (currentUser?.role === 0 || currentUser?.role === 1) {
                        setShowTeamMenu(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border border-transparent transition-colors ${
                      (currentUser?.role === 0 || currentUser?.role === 1)
                        ? 'hover:bg-slate-50 hover:border-slate-100 cursor-pointer'
                        : ''
                    }`}
                  >
                    <span className="font-bold text-[#1E3A8A] bg-[#1E3A8A]/5 px-2 py-0.5 rounded-md">
                      {task.teamInfo?.name || 'No Team'}
                    </span>
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
                  className={`bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#1E3A8A] text-xs font-bold ${
                    isOverdue() ? 'text-rose-600 border-rose-300 font-extrabold' : 'text-slate-700'
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

              {/* Tags / Labels */}
              <div className="flex flex-col gap-2 py-2 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Tags / Labels</span>
                  {isEditingTags ? (
                    <div className="flex gap-1">
                      <button
                        onClick={handleTagsSave}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        Save
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => {
                          setIsEditingTags(false);
                          setTagsInput(task.tags?.join(', ') || '');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingTags(true)}
                      className="text-[10px] font-bold text-[#1E3A8A] hover:text-[#0EA5E9] cursor-pointer"
                    >
                      Edit Tags
                    </button>
                  )}
                </div>
                {isEditingTags ? (
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. Bug, Feature, Design (comma separated)"
                    className="w-full text-[11px] p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-700"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {task.tags && task.tags.length > 0 ? (
                      task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic font-medium">No tags</span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1.5">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Subtask Progression</span>
                  <span className="text-slate-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#0EA5E9] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Sub-tasks checklist section */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
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
              {subTasks.map((sub) => {
                const subId = sub._id || sub.id;
                return (
                  <div
                    key={subId}
                    onClick={() => handleToggleSubtask(subId)}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={sub.isCompleted}
                      onChange={() => {}} // toggled on container click
                      className="mt-0.5 rounded border-slate-300 text-[#1E3A8A] focus:ring-blue-900/10 cursor-pointer"
                    />
                    <span className={`font-semibold text-slate-700 transition-colors select-none ${
                      sub.isCompleted ? 'line-through text-slate-400' : ''
                    }`}>
                      {sub.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {isAddingSubtask ? (
              <div className="flex gap-2 pt-1">
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
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-semibold text-slate-700"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateSubtask}
                  className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
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
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-lg text-[11px] border border-slate-200/50 hover:border-slate-300 transition-colors cursor-pointer text-center block"
              >
                + Add Subtask Item
              </button>
            )}
          </div>

          {/* Time Tracking Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="size-4.5 text-slate-400" />
                Time Tracking
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Total: {displayHours}h {displayMinutes}m
              </span>
            </div>

            {/* List of Time Logs */}
            {task.timeLogs && task.timeLogs.length > 0 ? (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {task.timeLogs.map((log: any, idx: number) => (
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

            {/* Log Time Form */}
            {isLoggingTime ? (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hours</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={logHours}
                      onChange={(e) => setLogHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Notes / Description</label>
                  <input
                    type="text"
                    placeholder="What did you work on?"
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] font-medium text-slate-700"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsLoggingTime(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={logTimeMutation.isPending || (logHours === 0 && logMinutes === 0)}
                    onClick={() => {
                      logTimeMutation.mutate({
                        taskId,
                        data: {
                          hours: logHours,
                          minutes: logMinutes,
                          description: logDescription.trim() || undefined,
                        },
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-[10px] font-bold hover:bg-[#152a63] cursor-pointer"
                  >
                    {logTimeMutation.isPending ? 'Saving...' : 'Save Log'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoggingTime(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold rounded-lg text-[11px] border border-slate-200/50 hover:border-slate-300 transition-colors cursor-pointer text-center block"
              >
                + Log Work Time
              </button>
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
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-0"
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
