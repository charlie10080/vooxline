import React, { useState } from 'react';
import type { CampaignStats } from '@/lib/metrics';
import { useWorkforceStore } from '@/store/useWorkforceStore';
import { resetApplicationState } from '@/lib/globalReset';
import {
  getCampaignStats,
  getPayrollTotals,
  getWorkedMinutes,
  getDeviationMinutes,
} from '@/lib/metrics';
import {
  formatUSD,
  formatDuration,
  formatDeviation,
} from '@/lib/time';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  Building2,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import { PageHeader, Button, Badge, StatCard, EmptyState } from '@/components/ui';

export const PayrollPage: React.FC = () => {
  const { campaigns, timeEntries, agents } = useWorkforceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Mapeos rápidos de agentes y campañas
  const agentMap = new Map(agents.map((a) => [a.id, a]));
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Cálculos automáticos usando los helpers de lib/metrics.ts (sin duplicar)
  const campaignStats: CampaignStats[] = getCampaignStats(campaigns, timeEntries);
  const totals = getPayrollTotals(campaignStats);

  // Filtrar solo entradas aprobadas para la tabla de horas aprobadas
  const approvedEntries = timeEntries.filter((entry) => {
    if (entry.status !== 'approved') return false;

    if (selectedCampaignId !== 'all' && entry.campaignId !== selectedCampaignId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const agent = agentMap.get(entry.agentId);
      const campaign = campaignMap.get(entry.campaignId);
      const agentName = agent?.name.toLowerCase() ?? '';
      const employeeCode = agent?.employeeCode.toLowerCase() ?? '';
      const campaignName = campaign?.name.toLowerCase() ?? '';

      return (
        agentName.includes(q) ||
        employeeCode.includes(q) ||
        campaignName.includes(q)
      );
    }

    return true;
  });

  // Exportar a CSV usando Blob en el navegador (sin librerías)
  const handleExportCSV = () => {
    const allApproved = timeEntries.filter((e) => e.status === 'approved');

    const headers = ['Agente', 'Código', 'Campaña', 'Fecha', 'Horas', 'Costo (USD)'];

    const rows = allApproved.map((entry) => {
      const agent = agentMap.get(entry.agentId);
      const campaign = campaignMap.get(entry.campaignId);
      const workedMinutes = getWorkedMinutes(entry);
      const hoursDecimal = (workedMinutes / 60).toFixed(2);
      const costAmount = (
        (workedMinutes / 60) *
        (campaign?.costRate ?? 0)
      ).toFixed(2);
      const date = new Date(entry.clockIn).toISOString().split('T')[0];

      return [
        `"${agent?.name ?? 'Desconocido'}"`,
        `"${agent?.employeeCode ?? ''}"`,
        `"${campaign?.name ?? ''}"`,
        `"${date}"`,
        hoursDecimal,
        costAmount,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `registro_nomina_vooxline_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={DollarSign}
        eyebrow="OPERACIONES Y FINANZAS"
        title="Rentabilidad y nómina"
        description="Control de costos de personal, márgenes brutos por campaña y conciliación de turnos aprobados."
        actions={
          <>
            <Button variant="primary" icon={Download} onClick={handleExportCSV}>
              Exportar nómina (CSV)
            </Button>
            <Button
              icon={RotateCcw}
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
                  resetApplicationState();
                }
              }}
              title="Reiniciar todos los datos de prueba"
              aria-label="Reiniciar todos los datos de prueba"
            />
          </>
        }
      />

      {/* 1. Tarjetas de Resumen Arriba: Total Horas, Inversión Total Nómina, Margen Promedio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Horas acumuladas"
          value={`${totals.totalHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} h`}
          hint="Horas base de campaña + turnos aprobados"
          tone="accent"
          icon={Clock}
        />
        <StatCard
          label="Inversión total de nómina"
          value={formatUSD(totals.totalCost)}
          hint="Costo directo del personal (USD)"
          tone="warning"
          icon={Wallet}
        />
        <StatCard
          label="Margen bruto promedio"
          value={
            <span className="inline-flex items-baseline gap-2 text-vx-success">
              {totals.avgMarginPct.toFixed(1)}%
              <span className="inline-flex items-center gap-0.5 text-[13px]">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                Rentable
              </span>
            </span>
          }
          hint="Sobre ingresos brutos de facturación"
          tone="success"
          icon={TrendingUp}
        />
      </div>

      {/* 2. Sección "Rentabilidad por Campaña" */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-vx-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-vx-accent" />
            <h2 className="text-base font-bold text-vx-text">
              Rentabilidad por campaña
            </h2>
            <span className="text-[13px] tabular-nums text-vx-text-2/60">
              ({campaignStats.length} campañas activas)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[13px] text-vx-accent tabular-nums">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Cálculo automático</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b border-vx-border bg-vx-bg/60 text-xs tabular-nums text-vx-text-2/60">
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Horas acumuladas</th>
                <th className="py-3 px-4">Monto facturado</th>
                <th className="py-3 px-4">Costo de nómina</th>
                <th className="py-3 px-4 text-center">% Margen</th>
                <th className="py-3 px-4 min-w-[160px]">Rendimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vx-border/60 text-[13px]">
              {campaignStats.map((stat) => {
                const marginWidth = Math.min(100, Math.max(0, stat.marginPct));
                return (
                  <tr
                    key={stat.campaign.id}
                    className="hover:bg-vx-raised/50 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-vx-raised border border-vx-border flex items-center justify-center text-vx-accent tabular-nums font-bold text-[13px] shrink-0">
                          <Building2 className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="font-semibold text-vx-text block">
                            {stat.campaign.name}
                          </span>
                          <span className="text-xs text-vx-text-2/60 tabular-nums">
                            Tarifa: {formatUSD(stat.campaign.billRate)}/h • Costo:{' '}
                            {formatUSD(stat.campaign.costRate)}/h
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Horas Acumuladas */}
                    <td className="py-3.5 px-4 tabular-nums">
                      <span className="text-vx-text font-semibold">
                        {stat.hours.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-xs text-vx-text-2/50 block">
                        (base {stat.campaign.baselineHours}h)
                      </span>
                    </td>

                    {/* Monto Facturado */}
                    <td className="py-3.5 px-4 tabular-nums font-medium text-vx-text">
                      {formatUSD(stat.billed)}
                    </td>

                    {/* Costo de Nómina */}
                    <td className="py-3.5 px-4 tabular-nums text-vx-warning">
                      {formatUSD(stat.cost)}
                    </td>

                    {/* % de Margen */}
                    <td className="py-3.5 px-4 text-center">
                      <Badge tone="success">{stat.marginPct.toFixed(1)}%</Badge>
                    </td>

                    {/* Barra de Progreso Proporcional al Margen */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="w-full bg-vx-raised h-2 rounded-full overflow-hidden border border-vx-border">
                          <div
                            className="bg-gradient-to-r from-vx-success to-vx-accent h-full rounded-full transition-all duration-500"
                            style={{ width: `${marginWidth}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs tabular-nums text-vx-text-2/50">
                          <span>0%</span>
                          <span>{marginWidth.toFixed(0)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Tabla "Horas Aprobadas" */}
      <div className="bg-vx-surface border border-vx-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-vx-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-vx-success" />
            <h2 className="text-base font-bold text-vx-text">
              Horas aprobadas
            </h2>
            <span className="text-[13px] tabular-nums text-vx-text-2/60">
              ({approvedEntries.length} turnos validados para nómina)
            </span>
          </div>

          {/* Filtros de búsqueda y campaña */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                aria-label="Filtrar por campaña"
                className="w-full bg-vx-bg border border-vx-border text-[13px] text-vx-text-2 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-vx-accent appearance-none"
              >
                <option value="all">Todas las campañas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-vx-text-2/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-vx-text-2/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar agente o campaña"
                placeholder="Buscar agente..."
                className="w-full bg-vx-bg border border-vx-border text-[13px] text-vx-text rounded-xl pl-9 pr-3 py-2 placeholder:text-vx-text-2/40 focus:outline-none focus:border-vx-accent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-vx-border bg-vx-bg/60 text-xs tabular-nums text-vx-text-2/60">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Fecha del turno</th>
                <th className="py-3 px-4">Horas trabajadas</th>
                <th className="py-3 px-4">Desviación</th>
                <th className="py-3 px-4 text-right">Costo estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vx-border/60 text-[13px]">
              {approvedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Search}
                      title="No hay turnos aprobados que coincidan con la búsqueda"
                      description="Prueba con otra campaña u otro nombre de agente."
                    />
                  </td>
                </tr>
              ) : (
                approvedEntries.map((entry) => {
                  const agent = agentMap.get(entry.agentId);
                  const campaign = campaignMap.get(entry.campaignId);
                  const workedMinutes = getWorkedMinutes(entry);
                  const deviationMinutes = getDeviationMinutes(entry);
                  const cost =
                    (workedMinutes / 60) * (campaign?.costRate ?? 0);

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-vx-raised/50 transition-colors"
                    >
                      {/* Agente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-vx-raised border border-vx-border flex items-center justify-center text-vx-accent tabular-nums font-bold text-[13px] shrink-0">
                            {agent ? agent.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-vx-text">
                              {agent?.name ?? 'Desconocido'}
                            </span>
                            <span className="text-xs text-vx-text-2/50 tabular-nums block mt-0.5">
                              {agent?.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Campaña */}
                      <td className="py-3.5 px-4 text-vx-text-2">
                        {campaign?.name ?? 'Sin asignar'}
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 tabular-nums text-vx-text-2">
                        <span className="text-vx-text">
                          {new Date(entry.clockIn).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Horas Trabajadas */}
                      <td className="py-3.5 px-4 tabular-nums">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-vx-raised text-vx-text font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-vx-success" aria-hidden="true" />
                          {formatDuration(workedMinutes)}
                        </span>
                      </td>

                      {/* Desviación */}
                      <td className="py-3.5 px-4 tabular-nums text-[13px]">
                        <span
                          className={`px-2 py-0.5 rounded tabular-nums font-semibold ${
                            deviationMinutes === 0
                              ? 'bg-vx-raised text-vx-text-2'
                              : 'bg-vx-raised text-vx-accent'
                          }`}
                        >
                          {formatDeviation(deviationMinutes)}
                        </span>
                      </td>

                      {/* Costo Estimado */}
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-vx-warning">
                        {formatUSD(cost)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
