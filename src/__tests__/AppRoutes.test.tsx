import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AppRoutes } from '@/routes/AppRoutes';

describe('AppRoutes component', () => {
  it('renders landing page on default route "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/CONTRATACIÓN Y CONTACT CENTER B2B DE NUEVA GENERACIÓN/i)).toBeDefined();
  });

  it('renders login page on "/login"', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/ACCESO SEGURO • B2B & TALENTO/i)).toBeDefined();
  });

  it('renders agent portal on "/agente"', () => {
    render(
      <MemoryRouter initialEntries={['/agente']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/Portal del Agente Vooxline/i)).toBeDefined();
  });

  it('renders client dashboard on "/cliente"', () => {
    render(
      <MemoryRouter initialEntries={['/cliente']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Resumen Operativo/i).length).toBeGreaterThan(0);
  });
});
