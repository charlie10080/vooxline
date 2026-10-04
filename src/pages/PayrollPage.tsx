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
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#13171F] border border-[#242E3B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#66FCF1]/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#66FCF1]/10 text-[#66FCF1] border border-[#66FCF1]/30">
              OPERACIONES & FINANZAS
            </span>
            <span className="text-xs text-[#C5C6C7]/50 font-mono">
              Sincronización en Vivo con Horas Aprobadas
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#66FCF1]" />
            <span>Rentabilidad y Nómina</span>
          </h1>
          <p className="text-sm text-[#C5C6C7]/80">
            Control de costos de personal, márgenes brutos por cuenta B2B y conciliación de turnos.
          </p>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#66FCF1] hover:bg-[#52e0d6] text-[#0B0C10] text-xs font-bold transition-all shadow-[0_0_16px_rgba(102,252,241,0.25)] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Registro de Nómina (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Reiniciar todos los datos de demostración? Se restablecerán asistencias, usuarios, turnos y llamadas a su estado inicial.')) {
                resetApplicationState();
              }
            }}
            title="Reiniciar todos los datos de prueba"
            className="p-2.5 rounded-xl bg-[#1F2833]/60 hover:bg-[#1F2833] text-[#C5C6C7] hover:text-white border border-[#242E3B] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Tarjetas de Resumen Arriba: Total Horas, Inversión Total Nómina, Margen Promedio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total horas semanales */}
        <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Total Horas Acumuladas
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#66FCF1]/15 text-[#66FCF1] flex items-center justify-center border border-[#66FCF1]/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {totals.totalHours.toLocaleString('en-US', { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs text-[#C5C6C7]/60 font-mono">hrs</span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            Horas base de campaña + turnos aprobados
          </p>
        </div>

        {/* Inversión total de nómina */}
        <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Inversión Total de Nómina
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {formatUSD(totals.totalCost)}
            </span>
            <span className="text-xs text-[#F59E0B] font-mono">USD</span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            Costo directo de fuerza laboral B2B
          </p>
        </div>

        {/* Margen promedio */}
        <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#C5C6C7]/70 font-mono uppercase tracking-wider">
              Margen Bruto Promedio
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#10B981] font-mono">
              {totals.avgMarginPct.toFixed(1)}%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs text-[#10B981] font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Rentable
            </span>
          </div>
          <p className="text-[11px] text-[#C5C6C7]/50 mt-2 font-mono">
            Sobre ingresos brutos de facturación
          </p>
        </div>
      </div>

      {/* 2. Sección "Rentabilidad por Campaña" */}
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#242E3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#66FCF1]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Rentabilidad por Campaña
            </h2>
            <span className="text-xs font-mono text-[#C5C6C7]/60">
              ({campaignStats.length} cuentas B2B activas)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#66FCF1] font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Fórmulas automáticas de metrics.ts</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Horas Acumuladas</th>
                <th className="py-3 px-4">Monto Facturado</th>
                <th className="py-3 px-4">Costo de Nómina</th>
                <th className="py-3 px-4 text-center">% Margen</th>
                <th className="py-3 px-4 min-w-[160px]">Rendimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {campaignStats.map((stat) => {
                const marginWidth = Math.min(100, Math.max(0, stat.marginPct));
                return (
                  <tr
                    key={stat.campaign.id}
                    className="hover:bg-[#1A202C]/50 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-white block">
                            {stat.campaign.name}
                          </span>
                          <span className="text-[11px] text-[#C5C6C7]/60 font-mono">
                            Bill: {formatUSD(stat.campaign.billRate)}/h • Cost:{' '}
                            {formatUSD(stat.campaign.costRate)}/h
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Horas Acumuladas */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-white font-semibold">
                        {stat.hours.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-[10px] text-[#C5C6C7]/50 block">
                        (base {stat.campaign.baselineHours}h)
                      </span>
                    </td>

                    {/* Monto Facturado */}
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {formatUSD(stat.billed)}
                    </td>

                    {/* Costo de Nómina */}
                    <td className="py-3.5 px-4 font-mono text-[#F59E0B]">
                      {formatUSD(stat.cost)}
                    </td>

                    {/* % de Margen */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        {stat.marginPct.toFixed(1)}%
                      </span>
                    </td>

                    {/* Barra de Progreso Proporcional al Margen */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="w-full bg-[#1F2833] h-2 rounded-full overflow-hidden border border-[#242E3B]">
                          <div
                            className="bg-gradient-to-r from-[#10B981] to-[#66FCF1] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(102,252,241,0.4)]"
                            style={{ width: `${marginWidth}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-[#C5C6C7]/50">
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
      <div className="bg-[#13171F] border border-[#242E3B] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#242E3B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Horas Aprobadas
            </h2>
            <span className="text-xs font-mono text-[#C5C6C7]/60">
              ({approvedEntries.length} turnos validados para nómina)
            </span>
          </div>

          {/* Filtros de búsqueda y campaña */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative">
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="bg-[#0B0C10] border border-[#242E3B] text-xs text-[#C5C6C7] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#66FCF1] appearance-none"
              >
                <option value="all">Todas las Campañas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#C5C6C7]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agente..."
                className="w-full bg-[#0B0C10] border border-[#242E3B] text-xs text-white rounded-xl pl-9 pr-3 py-2 placeholder:text-[#C5C6C7]/40 focus:outline-none focus:border-[#66FCF1]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242E3B] bg-[#0B0C10]/60 text-[11px] font-mono text-[#C5C6C7]/60 uppercase tracking-wider">
                <th className="py-3 px-4">Agente</th>
                <th className="py-3 px-4">Campaña</th>
                <th className="py-3 px-4">Fecha Turno</th>
                <th className="py-3 px-4">Horas Trabajadas</th>
                <th className="py-3 px-4">Desviación</th>
                <th className="py-3 px-4 text-right">Costo Estimado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242E3B]/60 text-xs">
              {approvedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#C5C6C7]/50 font-mono">
                    No hay turnos con estado 'approved' que coincidan con la búsqueda.
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
                      className="hover:bg-[#1A202C]/50 transition-colors"
                    >
                      {/* Agente */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-[#1F2833] border border-[#242E3B] flex items-center justify-center text-[#66FCF1] font-mono font-bold text-xs shrink-0">
                            {agent ? agent.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-white">
                              {agent?.name ?? 'Desconocido'}
                            </span>
                            <span className="text-[10px] text-[#C5C6C7]/50 font-mono block mt-0.5">
                              {agent?.employeeCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Campaña */}
                      <td className="py-3.5 px-4 text-[#C5C6C7]">
                        {campaign?.name ?? 'Sin asignar'}
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-4 font-mono text-[#C5C6C7]">
                        <span className="text-white">
                          {new Date(entry.clockIn).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Horas Trabajadas */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1F2833] text-white font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          {formatDuration(workedMinutes)}
                        </span>
                      </td>

                      {/* Desviación */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-semibold ${
                            deviationMinutes === 0
                              ? 'bg-[#1F2833] text-[#C5C6C7]'
                              : 'bg-[#1F2833] text-[#66FCF1]'
                          }`}
                        >
                          {formatDeviation(deviationMinutes)}
                        </span>
                      </td>

                      {/* Costo Estimado */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F59E0B]">
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
