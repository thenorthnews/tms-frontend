import { ContentLayout } from '@/components/layouts';
import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';

const DashboardRoute = () => {
  return (
    <ContentLayout title="Dashboard">
      <DashboardOverview />
    </ContentLayout>
  );
};

export default DashboardRoute;
