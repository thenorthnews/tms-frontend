import { ContentLayout } from '@/components/layouts';
import { TeamManagement } from '@/features/teams/components/team-management';

const TeamsRoute = () => {
  return (
    <ContentLayout title="My Team">
      <div className="mt-4 duration-300 animate-in fade-in">
        <TeamManagement />
      </div>
    </ContentLayout>
  );
};

export default TeamsRoute;
