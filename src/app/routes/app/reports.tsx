import { ContentLayout } from '@/components/layouts';
import { ReportsDashboard } from '@/features/reports/components/reports';
import { Authorization, ROLES } from '@/lib/authorization';

const ReportsRoute = () => {
  return (
    <ContentLayout title="Reports & Analytics">
      <Authorization
        forbiddenFallback={
          <div className="p-4 text-center text-red-500">
            Only CEOs and department managers are authorized to view analytics reports.
          </div>
        }
        allowedRoles={[ROLES.CEO, ROLES.MANAGER]}
      >
        <div className="mt-4 animate-in fade-in duration-300">
          <ReportsDashboard />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default ReportsRoute;
