import {
  Clipboard,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  Check,
  Trash2,
  Sparkles,
  Inbox,
} from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

export const NotificationsList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // TODO: Replace hardcoded mock notifications with real API integration
  // These are placeholder entries and should be fetched from a backend endpoint
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'assigned', // clipboard icon
      message: 'Sarah Jenkins assigned a new task to you:',
      taskTitle: 'Define userinfo mongoose schema refactoring',
      taskId: '6a5dc723b44fd31be8d75194',
      time: '10 minutes ago',
      read: false,
    },
    {
      id: 'notif-2',
      type: 'deadline', // clock icon
      message: 'Deadline approaching soon for task:',
      taskTitle: 'Verify credentials seeding behavior in main.ts',
      taskId: '6a5dc723b44fd31be8d75195',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 'notif-3',
      type: 'status', // checkmark icon
      message: 'Alex Rivera marked task status as Completed:',
      taskTitle: 'Remove old UserInfo controller endpoints',
      taskId: '6a5dc723b44fd31be8d75196',
      time: 'Yesterday',
      read: true,
    },
    {
      id: 'notif-4',
      type: 'reassigned', // arrow icon
      message: 'Task was reassigned to Marcus Vance by you:',
      taskTitle: 'Deploy build verification setup',
      taskId: '6a5dc723b44fd31be8d75197',
      time: '2 days ago',
      read: true,
    },
  ]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Mark all as read
  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addNotification({
      type: 'success',
      title: 'All notifications marked as read',
    });
  };

  // Mark individual as read
  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  // Delete notification
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filter list
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  // Get icon by notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assigned':
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] sm:size-10">
            <Clipboard className="size-4.5 sm:size-5" />
          </div>
        );
      case 'deadline':
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-600 sm:size-10">
            <Clock className="size-4.5 sm:size-5" />
          </div>
        );
      case 'status':
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 sm:size-10">
            <CheckCircle2 className="size-4.5 sm:size-5" />
          </div>
        );
      default:
        return (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#0EA5E9] sm:size-10">
            <ArrowRightLeft className="size-4.5 sm:size-5" />
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Top action row */}
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {/* Tab filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'unread'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            Unread
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="size-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Mark all as read */}
        {notifications.some((n) => !n.read) && (
          <a
            href="#"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-bold text-[#1E3A8A] transition-colors hover:text-[#0EA5E9]"
          >
            <Check className="size-4" />
            Mark all as read
          </a>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm duration-500 animate-in fade-in">
          <div className="mb-4 flex size-16 animate-bounce items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
            <Inbox className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">
            You're all caught up!
          </h3>
          <p className="mt-1 max-w-xs text-xs font-semibold text-slate-400">
            There are no active notifications to show in the selected tab
            context.
          </p>
        </div>
      ) : (
        /* Notification items */
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkSingleRead(notif.id)}
              className={`group flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 text-left text-xs transition-all duration-300 ${
                notif.read
                  ? 'border-slate-100 bg-white hover:border-slate-200'
                  : 'border-l-4 border-sky-100 border-l-[#0EA5E9] bg-sky-50/20 shadow-sm hover:border-sky-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Colored circle icon */}
                {getNotificationIcon(notif.type)}

                <div className="mt-0.5 space-y-1">
                  <p className="font-semibold leading-relaxed text-slate-500">
                    {notif.message}
                  </p>

                  {/* Related Task link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(paths.app.editTask.getHref(notif.taskId));
                    }}
                    className="block text-left text-xs font-bold text-[#1E3A8A] transition-colors hover:text-[#0EA5E9] hover:underline"
                  >
                    {notif.taskTitle}
                  </button>
                </div>
              </div>

              {/* Timestamp + Actions */}
              <div className="flex shrink-0 flex-col items-end gap-3">
                <span className="text-[10px] font-bold tracking-tight text-slate-400">
                  {notif.time}
                </span>

                <button
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  className="rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-slate-100 hover:text-rose-600 group-hover:opacity-100"
                  title="Delete notification"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
