import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientTier } from '../../types';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  Sparkles,
  ShieldAlert,
  Search,
  Building2,
  Award,
  TrendingUp,
  FileCheck2,
  Plus,
} from 'lucide-react';
import {
  CURRENT_VIRTUAL_TIME,
  getDeadlineBadge,
  formatDateLabel,
} from '../../utils/calendarUtils';

interface ClientTierManagementProps {
  onScheduleMeetingForClient?: (clientId: string, companyId: string) => void;
}

export const ClientTierManagement: React.FC<ClientTierManagementProps> = ({
  onScheduleMeetingForClient,
}) => {
  const {
    filteredClients,
    companies,
    selectedTier,
    setSelectedTier,
    dispatchMonthlyUpdate,
    recordQuarterlyReview,
    runDeadlineScan,
    updateClient,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);

  const companyMap = new Map(companies.map((c) => [c.id, c]));

  // Filter clients by search query
  const displayedClients = filteredClients.filter((client) => {
    const query = searchQuery.toLowerCase();
    const comp = companyMap.get(client.companyId);
    return (
      client.name.toLowerCase().includes(query) ||
      client.industry.toLowerCase().includes(query) ||
      client.contact.name.toLowerCase().includes(query) ||
      (comp && comp.name.toLowerCase().includes(query))
    );
  });

  // Tier counts
  const tierACount = filteredClients.filter((c) => c.tier === 'A').length;
  const tierBCount = filteredClients.filter((c) => c.tier === 'B').length;
  const tierCCount = filteredClients.filter((c) => c.tier === 'C').length;

  // Tier A compliance metrics
  const tierAClients = filteredClients.filter((c) => c.tier === 'A');
  const overdueMonthlyTierA = tierAClients.filter((c) => {
    const badge = getDeadlineBadge(c.monthlyUpdateDeadline);
    return badge.status === 'overdue';
  });
  const imminentMonthlyTierA = tierAClients.filter((c) => {
    const badge = getDeadlineBadge(c.monthlyUpdateDeadline);
    return badge.status === 'imminent' || badge.status === 'due_today';
  });

  return (
    <div className="space-y-6">
      {/* Category A Mandatory Cadence Spotlight Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-indigo-500/30 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500 text-white">
                Category A Tier Standard
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                Mandatory Governance & Executive Review Rules
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Tier A clients are top-tier partnerships. Enterprise policy requires{' '}
              <strong className="text-neutral-100 font-semibold">mandatory monthly updates</strong> (every 30 days)
              and <strong className="text-neutral-100 font-semibold">detailed quarterly performance reviews</strong>.
              Automated reminders are continuously dispatched as deadlines approach.
            </p>
          </div>

          {/* Automated Reminders Trigger Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => runDeadlineScan()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              Scan & Trigger Team Reminders
            </button>
          </div>
        </div>

        {/* Live Deadline Status Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold tabular-nums text-neutral-100 text-sm">
                {overdueMonthlyTierA.length}
              </span>
              <span className="text-neutral-400 ml-1.5 text-xs">Overdue Monthly Updates</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold tabular-nums text-neutral-100 text-sm">
                {imminentMonthlyTierA.length}
              </span>
              <span className="text-neutral-400 ml-1.5 text-xs">Deadlines in &lt; 7 Days</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold tabular-nums text-neutral-100 text-sm">
                {tierAClients.length - overdueMonthlyTierA.length - imminentMonthlyTierA.length}
              </span>
              <span className="text-neutral-400 ml-1.5 text-xs">On Track & Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Breakdown Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier A card */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'A' ? 'ALL' : 'A')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'A'
              ? 'bg-indigo-950/30 border-indigo-500 shadow-sm ring-1 ring-indigo-500/40'
              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Category A ({tierACount})
            </span>
            <span className="text-xs text-neutral-400">Top Priority</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-sm font-semibold text-neutral-100">Executive Strategic Accounts</div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Mandatory monthly updates · Quarterly performance review · Bi-weekly follow-ups
            </p>
          </div>
        </div>

        {/* Tier B card */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'B' ? 'ALL' : 'B')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'B'
              ? 'bg-neutral-800/80 border-neutral-600 shadow-sm ring-1 ring-neutral-500'
              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
              Category B ({tierBCount})
            </span>
            <span className="text-xs text-neutral-400">Core Growth</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-sm font-semibold text-neutral-100">Scaling Mid-Tier Clients</div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Bi-monthly executive touchpoints · Semi-annual strategic roadmap alignment
            </p>
          </div>
        </div>

        {/* Tier C card */}
        <div
          onClick={() => setSelectedTier(selectedTier === 'C' ? 'ALL' : 'C')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedTier === 'C'
              ? 'bg-neutral-800/80 border-neutral-600 shadow-sm ring-1 ring-neutral-500'
              : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
              Category C ({tierCCount})
            </span>
            <span className="text-xs text-neutral-400">Standard Tier</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-sm font-semibold text-neutral-100">Standard SLA Accounts</div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Quarterly status digests · Annual contract renewal health checks
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, industry, or contact..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">Filter by Tier:</span>
          {(['ALL', 'A', 'B', 'C'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : `Tier ${tier}`}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayedClients.map((client) => {
          const comp = companyMap.get(client.companyId);
          const monthlyBadge = getDeadlineBadge(client.monthlyUpdateDeadline);
          const quarterlyBadge = getDeadlineBadge(client.quarterlyReviewDeadline);

          return (
            <div
              key={client.id}
              className={`bg-neutral-900 border rounded-xl p-5 space-y-4 transition-all ${
                client.tier === 'A'
                  ? 'border-neutral-800 hover:border-indigo-500/50'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Client Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        client.tier === 'A'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : client.tier === 'B'
                          ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      Tier {client.tier}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-neutral-500" />
                      {comp?.name || 'Company Profile'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-neutral-100">{client.name}</h3>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {client.industry} · ACV: ${client.annualContractValue.toLocaleString()}
                  </div>
                </div>

                {/* Health Score Gauge */}
                <div className="text-right">
                  <div className="text-xs text-neutral-400">Health Score</div>
                  <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
                    {client.healthScore}/100
                  </div>
                </div>
              </div>

              {/* Deadlines Section */}
              <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-3 text-xs">
                {/* Monthly Update Cadence */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-neutral-400 font-medium">
                      Mandatory Monthly Update
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 font-mono tabular-nums">
                      Last sent:{' '}
                      {client.lastMonthlyUpdateSent
                        ? formatDateLabel(client.lastMonthlyUpdateSent)
                        : 'None logged'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${monthlyBadge.bgClass}`}>
                      {monthlyBadge.label}
                    </span>
                    <button
                      onClick={() => dispatchMonthlyUpdate(client.id)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-[11px] font-medium border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Dispatch monthly report & advance deadline +30 days"
                    >
                      <Send className="w-3 h-3 text-indigo-400" />
                      Dispatch
                    </button>
                  </div>
                </div>

                <div className="border-t border-neutral-800/80" />

                {/* Detailed Quarterly Performance Review */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-neutral-400 font-medium">
                      Quarterly Performance Review
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 font-mono tabular-nums">
                      Last held:{' '}
                      {client.lastQuarterlyReviewHeld
                        ? formatDateLabel(client.lastQuarterlyReviewHeld)
                        : 'None logged'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${quarterlyBadge.bgClass}`}>
                      {quarterlyBadge.label}
                    </span>
                    <button
                      onClick={() => recordQuarterlyReview(client.id)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-[11px] font-medium border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Mark QBR completed & advance deadline +90 days"
                    >
                      <FileCheck2 className="w-3 h-3 text-emerald-400" />
                      Log QBR
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact and Quick Schedule */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="text-neutral-400">
                  <span className="text-neutral-200 font-medium">{client.contact.name}</span>
                  <span className="text-neutral-500"> ({client.contact.title})</span>
                </div>

                <div className="flex items-center gap-2">
                  {onScheduleMeetingForClient && (
                    <button
                      onClick={() => onScheduleMeetingForClient(client.id, client.companyId)}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      Schedule
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedClientForEdit(client)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium border border-neutral-700 cursor-pointer"
                  >
                    Edit Tier
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Tier / Client Modal */}
      {selectedClientForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-5 space-y-4 text-xs text-neutral-200 shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-100">
              Configure Client Tier & Cadence ({selectedClientForEdit.name})
            </h3>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Client Tier Category</label>
              <select
                value={selectedClientForEdit.tier}
                onChange={(e) =>
                  setSelectedClientForEdit({
                    ...selectedClientForEdit,
                    tier: e.target.value as ClientTier,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200"
              >
                <option value="A">Category A - Mandatory Monthly & Quarterly Review</option>
                <option value="B">Category B - Bi-Monthly Executive Sync</option>
                <option value="C">Category C - Standard SLA & Annual Health Check</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Monthly Update Deadline (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={selectedClientForEdit.monthlyUpdateDeadline}
                onChange={(e) =>
                  setSelectedClientForEdit({
                    ...selectedClientForEdit,
                    monthlyUpdateDeadline: e.target.value,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Quarterly Review Deadline (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={selectedClientForEdit.quarterlyReviewDeadline}
                onChange={(e) =>
                  setSelectedClientForEdit({
                    ...selectedClientForEdit,
                    quarterlyReviewDeadline: e.target.value,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedClientForEdit(null)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateClient(selectedClientForEdit.id, selectedClientForEdit);
                  setSelectedClientForEdit(null);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
