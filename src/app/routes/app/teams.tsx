import { ContentLayout } from '@/components/layouts';
import { TeamManagement } from '@/features/teams/components/team-management';

const TeamsRoute = () => {
  return (
    <ContentLayout title="My Team">
      <div className="mt-4 animate-in fade-in duration-300">
        <TeamManagement />
      </div>
    </ContentLayout>
  );
};

export default TeamsRoute;
