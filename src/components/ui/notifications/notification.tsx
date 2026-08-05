import { Info, CircleAlert, CircleX, CircleCheck } from 'lucide-react';

const icons = {
  info: <Info className="size-6 text-blue-500" aria-hidden="true" />,
  success: <CircleCheck className="size-6 text-green-500" aria-hidden="true" />,
  warning: (
    <CircleAlert className="size-6 text-yellow-500" aria-hidden="true" />
  ),
  error: <CircleX className="size-6 text-red-500" aria-hidden="true" />,
};

export type NotificationProps = {
  notification: {
    id: string;
    type: keyof typeof icons;
    title: string;
    message?: string;
  };
  onDismiss: (id: string) => void;
};

import { useEffect } from 'react';

export const Notification = ({
  notification: { id, type, title, message, duration = 3000 },
  onDismiss,
}: NotificationProps & { notification: { duration?: number } }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div className="pointer-events-auto flex items-center gap-3 overflow-hidden rounded-full bg-white px-5 py-3 shadow-lg ring-1 ring-black/5 duration-300 animate-in fade-in slide-in-from-top-5">
      <div className="flex items-center gap-3" role="alert" aria-label={title}>
        <div className="flex shrink-0 items-center justify-center">
          {icons[type]}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium leading-tight text-gray-900">
            {title}
          </p>
          {message && (
            <p className="mt-0.5 text-sm leading-tight text-gray-500">
              {message}
            </p>
          )}
        </div>
      </div>
      <button
        className="ml-2 shrink-0 rounded-full bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        onClick={() => onDismiss(id)}
      >
        <span className="sr-only">Close</span>
        <CircleX className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
};
