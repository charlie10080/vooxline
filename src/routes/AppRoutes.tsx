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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* GENERAL */}
        <Route path="/" element={<OverviewPage />} />
        <Route
          path="/activity"
          element={
            <PlaceholderPage
              title="Activity"
              section="GENERAL"
              description="Registro y auditoría de eventos de agentes, sesiones, llamadas e incidencias del centro de mando."
            />
          }
        />
        <Route
          path="/monitor"
          element={
            <PlaceholderPage
              title="Monitor en Vivo"
              section="GENERAL"
              description="Consola de monitoreo en tiempo real con latencias SIP, estados de llamadas y agentes en simultáneo."
            />
          }
        />

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
        <Route
          path="/chat"
          element={
            <PlaceholderPage
              title="Chat"
              section="COMMUNICATION"
              description="Canales de mensajería interna entre supervisores y agentes por campaña."
            />
          }
        />
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
        <Route
          path="/director"
          element={
            <PlaceholderPage
              title="Director"
              section="COMMUNICATION"
              description="Canal de comunicación de dirección y avisos ejecutivos para operaciones de call center."
            />
          }
        />
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
        <Route
          path="/helpdesk"
          element={
            <PlaceholderPage
              title="Help Desk"
              section="COMMUNICATION"
              description="Gestión de tickets técnicos para soporte de estaciones de trabajo, diademas y telefonía SIP."
            />
          }
        />

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
    </Routes>
  );
};
