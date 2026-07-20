import { ContentLayout } from '@/components/layouts';
import { NotificationsList } from '@/features/notifications/components/notifications-list';

const NotificationsRoute = () => {
  return (
    <ContentLayout title="Notifications">
      <div className="mt-4 animate-in fade-in duration-300">
        <NotificationsList />
      </div>
    </ContentLayout>
  );
};

export default NotificationsRoute;
