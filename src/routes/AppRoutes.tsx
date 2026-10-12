import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { TimeClockPage } from '@/pages/TimeClockPage';
import { TimeOffPage } from '@/pages/TimeOffPage';
import { PayrollPage } from '@/pages/PayrollPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { UsersPage } from '@/pages/UsersPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { SchedulingPage } from '@/pages/SchedulingPage';
import { MonitorPage } from '@/pages/MonitorPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { DirectorPage } from '@/pages/DirectorPage';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { HelpDeskPage } from '@/pages/HelpDeskPage';
import { ChatPage } from '@/pages/ChatPage';
import { PortalHomePage } from '@/pages/portal/PortalHomePage';
import { PortalTimesheetPage } from '@/pages/portal/PortalTimesheetPage';
import { PortalTimeOffPage } from '@/pages/portal/PortalTimeOffPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* GENERAL */}
        <Route path="/" element={<OverviewPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/monitor" element={<MonitorPage />} />

        {/* USERS & GROUPS */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route
          path="/automations"
          element={
            <PlaceholderPage
              title="Automations"
              section="USERS & GROUPS"
              description="Flujos automatizados de alertas de ausentismo, reportes de turnos y sincronización de eventos."
            />
          }
        />

        {/* COMMUNICATION */}
        <Route path="/chat" element={<ChatPage />} />
        <Route
          path="/updates"
          element={
            <PlaceholderPage
              title="Updates"
              section="COMMUNICATION"
              description="Boletines operativos, avisos urgentes y actualizaciones de procesos para el equipo."
            />
          }
        />
        <Route path="/director" element={<DirectorPage />} />
        <Route
          path="/forms"
          element={
            <PlaceholderPage
              title="Forms"
              section="COMMUNICATION"
              description="Formularios de control de calidad, encuestas de clima y cuestionarios de soporte."
            />
          }
        />
        <Route path="/helpdesk" element={<HelpDeskPage />} />

        {/* OPERATIONS */}
        <Route path="/time-clock" element={<TimeClockPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/payroll" element={<PayrollPage />} />

        {/* HR & SKILLS */}
        <Route
          path="/celebrations"
          element={
            <PlaceholderPage
              title="Celebrations"
              section="HR & SKILLS"
              description="Reconocimientos por puntualidad, aniversarios laborales y logros de calidad (QA Score)."
            />
          }
        />
        <Route path="/time-off" element={<TimeOffPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Portal del agente */}
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<PortalHomePage />} />
        <Route path="horas" element={<PortalTimesheetPage />} />
        <Route path="permisos" element={<PortalTimeOffPage />} />
        <Route path="soporte" element={<HelpDeskPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Route>
    </Routes>
  );
};
