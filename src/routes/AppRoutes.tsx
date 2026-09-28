import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { AgentPortalPage } from '@/pages/AgentPortalPage';
import { ClientDashboardPage } from '@/pages/ClientDashboardPage';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminCommandCenterPage } from '@/pages/AdminCommandCenterPage';
import { AdminActivityPage } from '@/pages/admin/AdminActivityPage';
import { AdminMonitorPage } from '@/pages/admin/AdminMonitorPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Pantalla principal pública / Index de Vooxline */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Portal de Autenticación / Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* 3. Centro de Mando Maestro de Super Admin con Layout Dedicado (Sidebar + Header + Rutas Hijas) */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* /admin -> Visión General (Overview) */}
        <Route index element={<AdminCommandCenterPage />} />
        {/* /admin/activity -> Historial y Auditoría */}
        <Route path="activity" element={<AdminActivityPage />} />
        {/* /admin/monitor -> Monitor en Vivo (Tiempo Real) */}
        <Route path="monitor" element={<AdminMonitorPage />} />
        {/* /admin/users -> Directorio de Usuarios y Talento */}
        <Route path="users" element={<AdminUsersPage />} />
        {/* Fallback de subrutas no asignadas al Overview */}
        <Route path="*" element={<AdminCommandCenterPage />} />
      </Route>

      {/* 4. Dashboard B2B Ejecutivo (Posee su propio Sidebar & Header dedicado) */}
      <Route path="/cliente" element={<ClientDashboardPage />} />

      {/* 5. Portal del Agente (Reloj Checador y Consola con Sidebar & Header dedicado) */}
      <Route path="/agente" element={<AgentPortalPage />} />

      {/* Redirección por defecto ante rutas desconocidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
