import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Clipboard,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  Check,
  Trash2,
  Sparkles,
  Inbox
} from 'lucide-react';

import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';

export const NotificationsList = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  // --- NOTIFICATIONS STATE ---
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'assigned', // clipboard icon
      message: 'Sarah Jenkins assigned a new task to you:',
      taskTitle: 'Define userinfo mongoose schema refactoring',
      taskId: '6a5dc723b44fd31be8d75194',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 'notif-2',
      type: 'deadline', // clock icon
      message: 'Deadline approaching soon for task:',
      taskTitle: 'Verify credentials seeding behavior in main.ts',
      taskId: '6a5dc723b44fd31be8d75195',
      time: '2 hours ago',
      read: false
    },
    {
      id: 'notif-3',
      type: 'status', // checkmark icon
      message: 'Alex Rivera marked task status as Completed:',
      taskTitle: 'Remove old UserInfo controller endpoints',
      taskId: '6a5dc723b44fd31be8d75196',
      time: 'Yesterday',
      read: true
    },
    {
      id: 'notif-4',
      type: 'reassigned', // arrow icon
      message: 'Task was reassigned to Marcus Vance by you:',
      taskTitle: 'Deploy build verification setup',
      taskId: '6a5dc723b44fd31be8d75197',
      time: '2 days ago',
      read: true
    }
  ]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Mark all as read
  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addNotification({
      type: 'success',
      title: 'All notifications marked as read',
    });
  };

  // Mark individual as read
  const handleMarkSingleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Delete notification
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  // Get icon by notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assigned':
        return (
          <div className="size-9 sm:size-10 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center shrink-0">
            <Clipboard className="size-4.5 sm:size-5" />
          </div>
        );
      case 'deadline':
        return (
          <div className="size-9 sm:size-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="size-4.5 sm:size-5" />
          </div>
        );
      case 'status':
        return (
          <div className="size-9 sm:size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="size-4.5 sm:size-5" />
          </div>
        );
      default:
        return (
          <div className="size-9 sm:size-10 rounded-full bg-blue-50 text-[#0EA5E9] flex items-center justify-center shrink-0 border border-blue-100">
            <ArrowRightLeft className="size-4.5 sm:size-5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top action row */}
      <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
        
        {/* Tab filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-[#1E3A8A] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Unread
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="size-2 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Mark all as read */}
        {notifications.some(n => !n.read) && (
          <a
            href="#"
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-[#1E3A8A] hover:text-[#0EA5E9] transition-colors flex items-center gap-1"
          >
            <Check className="size-4" />
            Mark all as read
          </a>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        
        /* Empty State */
        <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm animate-in fade-in duration-500">
          <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-400 mb-4 animate-bounce">
            <Inbox className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">You're all caught up!</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1 font-semibold">
            There are no active notifications to show in the selected tab context.
          </p>
        </div>
      ) : (
        
        /* Notification items */
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkSingleRead(notif.id)}
              className={`p-4 rounded-xl border transition-all duration-300 flex items-start justify-between gap-4 text-xs text-left cursor-pointer group ${
                notif.read
                  ? 'bg-white border-slate-100 hover:border-slate-200'
                  : 'bg-sky-50/20 border-sky-100 hover:border-sky-200 shadow-sm border-l-4 border-l-[#0EA5E9]'
              }`}
            >
              <div className="flex gap-3.5 items-start">
                {/* Colored circle icon */}
                {getNotificationIcon(notif.type)}

                <div className="space-y-1 mt-0.5">
                  <p className="text-slate-500 font-semibold leading-relaxed">
                    {notif.message}
                  </p>
                  
                  {/* Related Task link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(paths.app.editTask.getHref(notif.taskId));
                    }}
                    className="text-xs font-bold text-[#1E3A8A] hover:text-[#0EA5E9] hover:underline transition-colors block text-left"
                  >
                    {notif.taskTitle}
                  </button>
                </div>
              </div>

              {/* Timestamp + Actions */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                  {notif.time}
                </span>

                <button
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
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
