import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  Building2,
  Users,
} from 'lucide-react';
import { getDeadlineBadge } from '../../utils/calendarUtils';

export const EngagementAnalytics: React.FC = () => {
  const { meetings, clients, companies, selectedCompanyId } = useApp();

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const relevantMeetings = meetings.filter((m) => {
    if (selectedCompanyId !== 'ALL' && m.companyId !== selectedCompanyId) return false;
    return true;
  });

  const relevantClients = clients.filter((c) => {
    if (selectedCompanyId !== 'ALL' && c.companyId !== selectedCompanyId) return false;
    return true;
  });

  // Calculate tier metrics
  const tierAClients = relevantClients.filter((c) => c.tier === 'A');
  const tierBClients = relevantClients.filter((c) => c.tier === 'B');
  const tierCClients = relevantClients.filter((c) => c.tier === 'C');

  // Estimate hours spent per tier from meetings
  let tierAHours = 0;
  let tierBHours = 0;
  let tierCHours = 0;

  const clientTierMap = new Map(clients.map((c) => [c.id, c.tier]));

  relevantMeetings.forEach((m) => {
    const tier = clientTierMap.get(m.clientId);
    const start = new Date(m.startTime).getTime();
    const end = new Date(m.endTime).getTime();
    const durationHours = Math.max(0.5, (end - start) / (1000 * 60 * 60));

    if (tier === 'A') tierAHours += durationHours;
    else if (tier === 'B') tierBHours += durationHours;
    else if (tier === 'C') tierCHours += durationHours;
  });

  const totalHours = tierAHours + tierBHours + tierCHours || 1;
  const tierAPercent = Math.round((tierAHours / totalHours) * 100);
  const tierBPercent = Math.round((tierBHours / totalHours) * 100);
  const tierCPercent = 100 - tierAPercent - tierBPercent;

  // Meeting type distribution
  const typeCounts: Record<string, number> = {};
  relevantMeetings.forEach((m) => {
    typeCounts[m.meetingType] = (typeCounts[m.meetingType] || 0) + 1;
  });

  // Tier A compliance metrics
  let tierACompliantMonthly = 0;
  let tierACompliantQuarterly = 0;

  tierAClients.forEach((c) => {
    const mBadge = getDeadlineBadge(c.monthlyUpdateDeadline);
    if (mBadge.status !== 'overdue') tierACompliantMonthly++;

    const qBadge = getDeadlineBadge(c.quarterlyReviewDeadline);
    if (qBadge.status !== 'overdue') tierACompliantQuarterly++;
  });

  const monthlyComplianceRate =
    tierAClients.length > 0 ? Math.round((tierACompliantMonthly / tierAClients.length) * 100) : 100;
  const quarterlyComplianceRate =
    tierAClients.length > 0
      ? Math.round((tierACompliantQuarterly / tierAClients.length) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner: Engagement Overview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Client Engagement & Compliance Analytics
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Tracking executive attention, Category A governance SLAs, and meeting distribution
            </p>
          </div>

          <div className="text-xs text-neutral-400 font-mono">
            Reporting Period: Q3 / Q4 2026
          </div>
        </div>
      </div>

      {/* Grid: 2 Primary Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Engagement Hours Distribution by Client Tier */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              Executive Time Allocation by Tier
            </h3>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              Total: {totalHours.toFixed(1)} hrs
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Category A accounts require concentrated focus (target &ge; 60% of partner engagement).
          </p>

          {/* Segmented Bar */}
          <div className="space-y-3">
            <div className="w-full h-4 bg-neutral-950 rounded-full overflow-hidden flex p-0.5 border border-neutral-800">
              <div
                className="bg-indigo-500 h-full rounded-l-full transition-all"
                style={{ width: `${tierAPercent}%` }}
                title={`Tier A: ${tierAPercent}%`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${tierBPercent}%` }}
                title={`Tier B: ${tierBPercent}%`}
              />
              <div
                className="bg-neutral-600 h-full rounded-r-full transition-all"
                style={{ width: `${tierCPercent}%` }}
                title={`Tier C: ${tierCPercent}%`}
              />
            </div>

            {/* Legend & Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Category A
                </div>
                <div className="text-lg font-bold font-mono text-neutral-100 mt-1 tabular-nums">
                  {tierAPercent}%
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5 tabular-nums">
                  {tierAHours.toFixed(1)} hours ({tierAClients.length} clients)
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Category B
                </div>
                <div className="text-lg font-bold font-mono text-neutral-100 mt-1 tabular-nums">
                  {tierBPercent}%
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5 tabular-nums">
                  {tierBHours.toFixed(1)} hours ({tierBClients.length} clients)
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <div className="flex items-center gap-1.5 text-neutral-300 font-semibold font-mono">
                  <span className="w-2 h-2 rounded-full bg-neutral-500" />
                  Category C
                </div>
                <div className="text-lg font-bold font-mono text-neutral-100 mt-1 tabular-nums">
                  {tierCPercent}%
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5 tabular-nums">
                  {tierCHours.toFixed(1)} hours ({tierCClients.length} clients)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Category A Governance Compliance Rate */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Category A Mandatory Cadence Compliance
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              100% Target
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Adherence to mandatory 30-day updates and 90-day executive performance reviews.
          </p>

          <div className="space-y-4 pt-1">
            {/* Monthly Update progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-200">
                  Monthly SLA Updates Delivered on Time
                </span>
                <span className="font-mono font-bold text-neutral-100 tabular-nums">
                  {monthlyComplianceRate}% ({tierACompliantMonthly}/{tierAClients.length})
                </span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    monthlyComplianceRate >= 90
                      ? 'bg-emerald-500'
                      : monthlyComplianceRate >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${monthlyComplianceRate}%` }}
                />
              </div>
            </div>

            {/* Quarterly Review progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-200">
                  Quarterly Performance Reviews Completed
                </span>
                <span className="font-mono font-bold text-neutral-100 tabular-nums">
                  {quarterlyComplianceRate}% ({tierACompliantQuarterly}/{tierAClients.length})
                </span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    quarterlyComplianceRate >= 90
                      ? 'bg-indigo-500'
                      : quarterlyComplianceRate >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${quarterlyComplianceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Type Volume Distribution */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Meeting Volume by Type & Session Purpose
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
              <div className="text-neutral-400 text-xs truncate" title={type}>
                {type}
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-100 mt-1 tabular-nums">
                {count}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {Math.round((count / (relevantMeetings.length || 1)) * 100)}% of total volume
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Health & ACV Matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Client Portfolio Health & Engagement Ranking
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {relevantClients.length} accounts monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-4">Client Name</th>
                <th className="py-2.5 px-4">Tier</th>
                <th className="py-2.5 px-4">Company Profile</th>
                <th className="py-2.5 px-4 text-right">Annual Value</th>
                <th className="py-2.5 px-4 text-center">Health Score</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {relevantClients
                .sort((a, b) => b.annualContractValue - a.annualContractValue)
                .map((cli) => {
                  const comp = companyMap.get(cli.companyId);
                  const mBadge = getDeadlineBadge(cli.monthlyUpdateDeadline);

                  return (
                    <tr key={cli.id} className="hover:bg-neutral-850/50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-neutral-100">
                        {cli.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-300">
                          Tier {cli.tier}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-neutral-400">{comp?.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-neutral-200">
                        ${cli.annualContractValue.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums font-semibold text-emerald-400">
                        {cli.healthScore}/100
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${mBadge.bgClass}`}>
                          {mBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
