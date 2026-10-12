import React, { useEffect } from 'react';
import { AppRoutes } from '@/routes/AppRoutes';
import { startActivityTracking } from '@/lib/activityTracker';
import { startAutomations } from '@/lib/automationEngine';

export const App: React.FC = () => {
  useEffect(() => {
    return startActivityTracking();
  }, []);
  useEffect(() => startAutomations(), []);

  return <AppRoutes />;
};

export default App;
