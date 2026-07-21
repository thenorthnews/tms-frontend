import { Navigate } from 'react-router';

import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

const LandingRoute = () => {
  const user = useUser();

  if (user.isLoading) {
    return null;
  }

  if (user.data) {
    return <Navigate to={paths.app.dashboard.getHref()} replace />;
  }

  return <Navigate to={paths.auth.login.getHref()} replace />;
};

export default LandingRoute;

