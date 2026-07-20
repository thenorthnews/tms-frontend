import { ContentLayout } from '@/components/layouts';
import { ReportsDashboard } from '@/features/reports/components/reports';
import { Authorization, ROLES } from '@/lib/authorization';

const ReportsRoute = () => {
  return (
    <ContentLayout title="Reports & Analytics">
      <Authorization
        forbiddenFallback={
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-3 text-center">
            <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Only organization administrators and department managers are authorized to view analytics reports.
            </p>
          </div>
        }
        allowedRoles={[ROLES.ADMIN]}
      >
        <div className="mt-4 animate-in fade-in duration-300">
          <ReportsDashboard />
        </div>
      </Authorization>
    </ContentLayout>
  );
};

export default ReportsRoute;
