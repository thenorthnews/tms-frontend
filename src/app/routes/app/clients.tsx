import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ContentLayout } from '@/components/layouts/content-layout';
import { ClientsList } from '@/features/clients/components/clients-list';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';

export const ClientsRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const userRole = user.data?.role;
  const isCEO = userRole === 0 || userRole === 'CEO';

  if (!isCEO) {
    return (
      <ContentLayout title="Access Denied">
        <div className="text-center py-16 font-bold flex flex-col items-center justify-center gap-3 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm my-8">
          <AlertCircle className="size-12 text-rose-500" />
          <span className="text-slate-800 text-lg font-extrabold">Access Restricted</span>
          <p className="text-slate-400 text-xs font-medium max-w-sm">
            Only the CEO has access to view, create, edit, or delete clients.
          </p>
          <Button
            onClick={() => navigate(paths.app.dashboard.getHref())}
            className="mt-2 rounded-full bg-[#1E3A8A] text-white text-xs font-bold px-6 py-2"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Button>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="Clients">
      <ClientsList />
    </ContentLayout>
  );
};

export default ClientsRoute;
