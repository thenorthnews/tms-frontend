import { ContentLayout } from '@/components/layouts';
import { NotificationsList } from '@/features/notifications/components/notifications-list';

const NotificationsRoute = () => {
  return (
    <ContentLayout title="Notifications">
      <div className="mt-4 duration-300 animate-in fade-in">
        <NotificationsList />
      </div>
    </ContentLayout>
  );
};

export default NotificationsRoute;
