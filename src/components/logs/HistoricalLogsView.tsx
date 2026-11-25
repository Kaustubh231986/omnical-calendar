import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Search,
  Users,
  FileText,
  Building2,
  ListTodo,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Layers,
  Table as TableIcon,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Repeat,
  Zap,
} from 'lucide-react';
import {
  formatDateLabel,
  formatTimeRange,
  generateLogsCsv,
  triggerFileDownload,
  formatCadenceLabel,
  isMeetingOverdueUnheld,
} from '../../utils/calendarUtils';

interface HistoricalLogsViewProps {
  onOpenMeeting: (id: string) => void;
}

export const HistoricalLogsView: React.FC<HistoricalLogsViewProps> = ({ onOpenMeeting }) => {
  const {
    meetings,
    companies,
    clients,
    selectedCompanyId,
    overdueOrMissedMeetings,
    runAutoRescheduleScan,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState<string>(
    selectedCompanyId !== 'ALL' ? selectedCompanyId : 'ALL'
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'company' | 'table'>('company');
  const [collapsedCompanies, setCollapsedCompanies] = useState<Record<string, boolean>>({});

  // Sync local filter when global company isolation changes
  useEffect(() => {
    setFilterCompanyId(selectedCompanyId !== 'ALL' ? selectedCompanyId : 'ALL');
  }, [selectedCompanyId]);

  const companyMap = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const clientMap = useMemo(() => new Map(clients.map((cl) => [cl.id, cl])), [clients]);

  // Meetings filtered by selected company
  const relevantMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (filterCompanyId !== 'ALL' && m.companyId !== filterCompanyId) return false;
      return true;
    });
  }, [meetings, filterCompanyId]);

  // Search, type, and status filtering, sorted newest first
  const displayedMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return relevantMeetings
      .filter((m) => {
        const client = clientMap.get(m.clientId);
        const comp = companyMap.get(m.companyId);

        const matchesSearch =
          !q ||
          m.title.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          (client && client.name.toLowerCase().includes(q)) ||
          (comp && comp.name.toLowerCase().includes(q));

        const matchesType = filterType === 'ALL' || m.meetingType === filterType;
        const matchesStatus = filterStatus === 'ALL' || m.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [relevantMeetings, searchQuery, filterType, filterStatus, clientMap, companyMap]);

  // Calculate attendance statistics across displayed meetings
  const stats = useMemo(() => {
    let totalAttendeesCount = 0;
    let attendedCount = 0;
    let tierATotalAttendees = 0;
    let tierAAttendedCount = 0;
    let totalActionItems = 0;
    let completedActionItems = 0;

    displayedMeetings.forEach((m) => {
      const client = clientMap.get(m.clientId);
      m.attendees.forEach((att) => {
        totalAttendeesCount++;
        if (att.status === 'attended') {
          attendedCount++;
        }
        if (client?.tier === 'A') {
          tierATotalAttendees++;
          if (att.status === 'attended') {
            tierAAttendedCount++;
          }
        }
      });

      m.notes.postMeeting.actionItems.forEach((act) => {
        totalActionItems++;
        if (act.completed) completedActionItems++;
      });
    });

    return {
      totalAttendeesCount,
      attendedCount,
      overallAttendanceRate:
        totalAttendeesCount > 0 ? Math.round((attendedCount / totalAttendeesCount) * 100) : 0,
      tierAAttendanceRate:
        tierATotalAttendees > 0 ? Math.round((tierAAttendedCount / tierATotalAttendees) * 100) : 0,
      totalActionItems,
      completedActionItems,
      actionCompletionRate:
        totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0,
    };
  }, [displayedMeetings, clientMap]);

  // Group displayed meetings by Company
  const companyGroups = useMemo(() => {
    const targetCompanies =
      filterCompanyId !== 'ALL'
        ? companies.filter((c) => c.id === filterCompanyId)
        : companies;

    return targetCompanies
      .map((comp) => {
        const compMeetings = displayedMeetings.filter((m) => m.companyId === comp.id);
        let present = 0;
        let total = 0;
        let completed = 0;
        let scheduled = 0;
        let syncedCount = 0;

        compMeetings.forEach((m) => {
          if (m.status === 'completed') completed++;
          if (m.status === 'scheduled') scheduled++;
          if (m.notes.preMeeting.syncedToAccount || m.notes.postMeeting.syncedToAccount) {
            syncedCount++;
          }
          m.attendees.forEach((a) => {
            total++;
            if (a.status === 'attended') present++;
          });
        });

        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          company: comp,
          meetings: compMeetings,
          completed,
          scheduled,
          syncedCount,
          attendanceRate,
        };
      })
      .filter((group) => filterCompanyId !== 'ALL' || group.meetings.length > 0);
  }, [companies, displayedMeetings, filterCompanyId]);

  // Raw meeting counts per company (for dropdown labels)
  const rawCountsByCompany = useMemo(() => {
    const counts: Record<string, number> = {};
    meetings.forEach((m) => {
      counts[m.companyId] = (counts[m.companyId] || 0) + 1;
    });
    return counts;
  }, [meetings]);

  const toggleCompanyCollapse = (companyId: string) => {
    setCollapsedCompanies((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const setAllCollapsed = (collapsed: boolean) => {
    const next: Record<string, boolean> = {};
    companyGroups.forEach((g) => {
      next[g.company.id] = collapsed;
    });
    setCollapsedCompanies(next);
  };

  const handleExportCsv = () => {
    const csvData = generateLogsCsv(displayedMeetings, companies, clients);
    const activeComp = filterCompanyId !== 'ALL' ? companyMap.get(filterCompanyId) : null;
    const filename = activeComp
      ? `omnical-${activeComp.slug}-meeting-logs.csv`
      : 'omnical-historical-meeting-logs.csv';
    triggerFileDownload(csvData, filename, 'text/csv');
  };

  const renderMeetingRow = (m: (typeof displayedMeetings)[number], showCompanyColumn: boolean) => {
    const comp = companyMap.get(m.companyId);
    const cli = clientMap.get(m.clientId);
    const dept = comp?.departments?.find((d) => d.id === m.departmentId);
    const present = m.attendees.filter((a) => a.status === 'attended').length;
    const total = m.attendees.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    const isOverdue = m.startTime >= '2026-10-01' && isMeetingOverdueUnheld(m);
    const forwardedCount = (m.notes.postMeeting.forwardedRecords || []).length;

    return (
      <tr key={m.id} className="hover:bg-neutral-850/50 transition-colors">
        {/* Date & Time */}
        <td className="py-3 px-4 font-mono tabular-nums text-neutral-400 whitespace-nowrap">
          <div className="text-neutral-200 font-medium">{formatDateLabel(m.startTime)}</div>
          <div className="text-[11px] text-neutral-500">
            {formatTimeRange(m.startTime, m.endTime)}
          </div>
          {m.originalStartTime && (
            <div className="text-[10px] text-amber-400/90 mt-0.5 flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" />
              Orig: {formatDateLabel(m.originalStartTime)}
            </div>
          )}
        </td>

        {/* Title & Client / Department / Service */}
        <td className="py-3 px-4">
          <div
            onClick={() => onOpenMeeting(m.id)}
            className="font-medium text-neutral-100 hover:text-indigo-400 cursor-pointer transition-colors"
          >
            {m.title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
            <span>
              {m.scope === 'department' && dept
                ? `Dept: ${dept.name}`
                : m.scope === 'company'
                ? 'Company Review'
                : cli?.name || 'Client'}{' '}
              · {m.meetingType}
            </span>
            {m.serviceScope && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px]">
                {m.serviceScope}
              </span>
            )}
            {m.engagementType === 'one_time' ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] inline-flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                One-Time Deal
              </span>
            ) : (
              m.cadence &&
              m.cadence !== 'one_time' && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] inline-flex items-center gap-0.5">
                  <Repeat className="w-2.5 h-2.5" />
                  {formatCadenceLabel(m.cadence)}
                </span>
              )
            )}
          </div>
        </td>

        {/* Company Profile (only in flat table mode) */}
        {showCompanyColumn && (
          <td className="py-3 px-4 whitespace-nowrap">
            <button
              onClick={() => setFilterCompanyId(m.companyId)}
              className="flex items-center gap-1.5 text-neutral-300 hover:text-indigo-300 cursor-pointer transition-colors"
              title={`Filter logs to ${comp?.name}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: comp?.accentHex || '#6366F1' }}
              />
              <span>{comp?.name}</span>
            </button>
          </td>
        )}

        {/* Status */}
        <td className="py-3 px-4 text-center whitespace-nowrap">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                m.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : m.status === 'missed'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : m.status === 'cancelled'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : isOverdue
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
              }`}
            >
              {isOverdue && m.status === 'scheduled' ? 'missed / overdue' : m.status}
            </span>
            {m.autoRescheduled && (
              <span className="text-[9px] font-mono text-amber-400">AUTO-RESCHED</span>
            )}
          </div>
        </td>

        {/* Client Tier */}
        <td className="py-3 px-4 text-center">
          {cli?.tier ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Tier {cli.tier}
            </span>
          ) : (
            <span className="text-neutral-500">-</span>
          )}
        </td>

        {/* Attendance Quorum */}
        <td className="py-3 px-4 text-center font-mono tabular-nums">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              rate >= 80
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-amber-400 bg-amber-500/10'
            }`}
          >
            {rate}% ({present}/{total})
          </span>
        </td>

        {/* Notes & Forwarded Mail Sync Status */}
        <td className="py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px]">
            <span
              title={
                m.notes.preMeeting.syncedToAccount
                  ? 'Pre-meeting brief synced to account'
                  : 'Pre-meeting not synced'
              }
              className={
                m.notes.preMeeting.syncedToAccount ? 'text-emerald-400' : 'text-neutral-600'
              }
            >
              Pre
            </span>
            <span>/</span>
            <span
              title={
                m.notes.postMeeting.syncedToAccount
                  ? 'Post-meeting notes synced to account'
                  : 'Post-meeting not synced'
              }
              className={
                m.notes.postMeeting.syncedToAccount ? 'text-emerald-400' : 'text-neutral-600'
              }
            >
              Post
            </span>
            {forwardedCount > 0 && (
              <span
                title={`${forwardedCount} company-wise mail forward(s) sent`}
                className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]"
              >
                <Mail className="w-2.5 h-2.5" />
                {forwardedCount}
              </span>
            )}
          </div>
        </td>

        {/* Actions */}
        <td className="py-3 px-4 text-right whitespace-nowrap">
          <button
            onClick={() => onOpenMeeting(m.id)}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
          >
            View Dossier
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Missed / Unheld Meeting Alert Bar */}
      {overdueOrMissedMeetings.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-200">
                {overdueOrMissedMeetings.length} Scheduled{' '}
                {overdueOrMissedMeetings.length === 1 ? 'Session' : 'Sessions'} Passed Without
                Holding
              </div>
              <div className="text-[11px] text-rose-300/80 mt-0.5">
                Auto-reschedule missed sessions to their next cadence slot with original date &amp;
                time preserved, or open any row to pick a custom slot.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenMeeting(overdueOrMissedMeetings[0].id)}
              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 text-xs font-medium cursor-pointer"
            >
              Inspect First
            </button>
            <button
              onClick={() => runAutoRescheduleScan()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Reschedule All ({overdueOrMissedMeetings.length})
            </button>
          </div>
        </div>
      )}

      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Overall Attendance Rate</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100 flex items-baseline gap-2">
            <span>{stats.overallAttendanceRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">
              ({stats.attendedCount}/{stats.totalAttendeesCount} present)
            </span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${stats.overallAttendanceRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Tier A Executive Attendance</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-indigo-300 flex items-baseline gap-2">
            <span>{stats.tierAAttendanceRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">High Quorum</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${stats.tierAAttendanceRate}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>
              {filterCompanyId === 'ALL'
                ? 'Meetings Logged'
                : `${companyMap.get(filterCompanyId)?.name || 'Company'} Meetings`}
            </span>
            <FileText className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
            {displayedMeetings.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            {filterCompanyId === 'ALL'
              ? `Across ${companyGroups.length} active company partitions`
              : 'Filtered to selected company partition'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Action Item Follow-Through</span>
            <ListTodo className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100 flex items-baseline gap-2">
            <span>{stats.actionCompletionRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">
              ({stats.completedActionItems}/{stats.totalActionItems} resolved)
            </span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${stats.actionCompletionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search, Company Selector & View Mode Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, clients, company..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Company-Wise Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={filterCompanyId}
              onChange={(e) => setFilterCompanyId(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-hidden cursor-pointer pr-1"
              title="Filter meetings by Company"
            >
              <option value="ALL" className="bg-neutral-900">
                All Companies ({meetings.length})
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="bg-neutral-900">
                  {c.name} ({rawCountsByCompany[c.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Meeting Types</option>
            <option value="Quarterly Review">Quarterly Review</option>
            <option value="Monthly Update">Monthly Update</option>
            <option value="Executive Follow-up">Executive Follow-up</option>
            <option value="Operational Check-in">Operational Check-in</option>
            <option value="Strategy Alignment">Strategy Alignment</option>
            <option value="Annual Health Check">Annual Health Check</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed (Unheld)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Right Controls: View Switcher + Export */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* View Mode Toggle: Company-Wise vs Flat Table */}
          <div className="flex items-center gap-0.5 bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('company')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'company'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Group meetings by Company Profile"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Company-Wise</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="View all meetings in a single flat table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>All Logs Table</span>
            </button>
          </div>

          {viewMode === 'company' && companyGroups.length > 1 && (
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setAllCollapsed(false)}
                className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={() => setAllCollapsed(true)}
                className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: COMPANY-WISE GROUPED MEETING LOGS                */}
      {/* ======================================================== */}
      {viewMode === 'company' && (
        <div className="space-y-4">
          {companyGroups.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 text-xs">
              No company meetings matching current filters.
            </div>
          ) : (
            companyGroups.map((group) => {
              const isCollapsed = !!collapsedCompanies[group.company.id];
              const isFocused = filterCompanyId === group.company.id;

              return (
                <div
                  key={group.company.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs"
                >
                  {/* Company Group Header */}
                  <div className="p-4 bg-neutral-950/70 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      onClick={() => toggleCompanyCollapse(group.company.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 shrink-0"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-neutral-800"
                        style={{ backgroundColor: group.company.accentHex }}
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-100 truncate">
                            {group.company.name}
                          </h3>
                          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                            {group.company.encryptionPartition}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          Lead: {group.company.accountExecutive.name} · {group.company.timezone}
                        </div>
                      </div>
                    </div>

                    {/* Company Stats Pills & Quick Focus */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono shrink-0">
                      <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 flex items-center gap-1">
                        <CalendarClock className="w-3 h-3 text-indigo-400" />
                        {group.meetings.length} total
                      </span>
                      <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {group.completed} done
                      </span>
                      <span className="px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">
                        {group.scheduled} upcoming
                      </span>
                      <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {group.attendanceRate}% attend
                      </span>

                      <button
                        onClick={() =>
                          setFilterCompanyId(isFocused ? 'ALL' : group.company.id)
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium border transition-colors cursor-pointer ${
                          isFocused
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        {isFocused ? 'Show All Companies' : 'Focus Company'}
                      </button>
                    </div>
                  </div>

                  {/* Company's Meetings Table */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      {group.meetings.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-500">
                          No meetings logged for {group.company.name} matching current filters.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs text-neutral-300">
                          <thead className="bg-neutral-950/40 text-neutral-400 font-semibold border-b border-neutral-800">
                            <tr>
                              <th className="py-2.5 px-4">Date & Time</th>
                              <th className="py-2.5 px-4">Session Title & Client</th>
                              <th className="py-2.5 px-4 text-center">Status</th>
                              <th className="py-2.5 px-4 text-center">Tier</th>
                              <th className="py-2.5 px-4 text-center">Attendance</th>
                              <th className="py-2.5 px-4 text-center">Notes Synced</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/80">
                            {group.meetings.map((m) => renderMeetingRow(m, false))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: FLAT TABLE VIEW                                  */}
      {/* ======================================================== */}
      {viewMode === 'table' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Session Title & Client</th>
                  <th className="py-3 px-4">Company Profile</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Client Tier</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4 text-center">Notes Synced</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {displayedMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      No historical logs matching filter.
                    </td>
                  </tr>
                ) : (
                  displayedMeetings.map((m) => renderMeetingRow(m, true))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
