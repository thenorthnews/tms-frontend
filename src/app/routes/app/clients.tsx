import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts/content-layout';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { ClientsList } from '@/features/clients/components/clients-list';
import { useUser } from '@/lib/auth';

export const ClientsRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const userRole = user.data?.role;
  const isCEO = userRole === 0 || userRole === 'CEO';

  if (!isCEO) {
    return (
      <ContentLayout title="Access Denied">
        <div className="my-8 flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white p-8 py-16 text-center font-bold shadow-sm">
          <AlertCircle className="size-12 text-rose-500" />
          <span className="text-lg font-extrabold text-slate-800">
            Access Restricted
          </span>
          <p className="max-w-sm text-xs font-medium text-slate-400">
            Only the CEO has access to view, create, edit, or delete clients.
          </p>
          <Button
            onClick={() => navigate(paths.app.dashboard.getHref())}
            className="mt-2 rounded-full bg-[#1E3A8A] px-6 py-2 text-xs font-bold text-white"
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
