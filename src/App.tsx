import React, { useEffect } from 'react';
import { AppRoutes } from '@/routes/AppRoutes';
import { startActivityTracking } from '@/lib/activityTracker';

export const App: React.FC = () => {
  useEffect(() => {
    return startActivityTracking();
  }, []);

  return <AppRoutes />;
};

export default App;
