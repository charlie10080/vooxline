import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AutomationsPage } from '@/pages/AutomationsPage';
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
import { UpdatesPage } from '@/pages/UpdatesPage';
import { FormsPage } from '@/pages/FormsPage';
import { CelebrationsPage } from '@/pages/CelebrationsPage';
import { PortalHomePage } from '@/pages/portal/PortalHomePage';
import { PortalTimesheetPage } from '@/pages/portal/PortalTimesheetPage';
import { PortalTimeOffPage } from '@/pages/portal/PortalTimeOffPage';
import { PortalSchedulePage } from '@/pages/portal/PortalSchedulePage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/Login/LoginPage';
import { ClientDashboardPage } from '@/pages/Client/ClientDashboardPage';
import { RequireRole } from '@/components/layout/RequireRole';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminCommandCenterPage } from '@/pages/admin/AdminCommandCenterPage';
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage';
import { AdminMonitorPage } from '@/pages/admin/AdminMonitorPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Web pública y portales de clientes/admin (conviven con el apartado de trabajadores) */}
      <Route path="/inicio" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cliente" element={<RequireRole roles={['client']}><ClientDashboardPage /></RequireRole>} />
      {/* Un solo portal de agente: el nuevo */}
      <Route path="/agente" element={<Navigate to="/portal" replace />} />
      <Route path="/admin" element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}>
        <Route index element={<AdminCommandCenterPage />} />
        <Route path="activity" element={<AdminActivityPage />} />
        <Route path="monitor" element={<AdminMonitorPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route element={<RequireRole roles={['supervisor', 'admin']}><AppLayout /></RequireRole>}>
        {/* GENERAL */}
        <Route path="/" element={<OverviewPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/monitor" element={<MonitorPage />} />

        {/* USERS & GROUPS */}
        <Route path="/users" element={<UsersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/automations" element={<AutomationsPage />} />

        {/* COMMUNICATION */}
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/director" element={<DirectorPage />} />
        <Route path="/forms" element={<FormsPage />} />
        <Route path="/helpdesk" element={<HelpDeskPage />} />

        {/* OPERATIONS */}
        <Route path="/time-clock" element={<TimeClockPage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/payroll" element={<PayrollPage />} />

        {/* HR & SKILLS */}
        <Route path="/celebrations" element={<CelebrationsPage />} />
        <Route path="/time-off" element={<TimeOffPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Portal del agente */}
      <Route path="/portal" element={<RequireRole roles={['agent', 'supervisor', 'admin']}><PortalLayout /></RequireRole>}>
        <Route index element={<PortalHomePage />} />
        <Route path="horario" element={<PortalSchedulePage />} />
        <Route path="horas" element={<PortalTimesheetPage />} />
        <Route path="permisos" element={<PortalTimeOffPage />} />
        <Route path="soporte" element={<HelpDeskPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="avisos" element={<UpdatesPage />} />
        <Route path="formularios" element={<FormsPage />} />
        <Route path="reconocimientos" element={<CelebrationsPage />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Route>
    </Routes>
  );
};
