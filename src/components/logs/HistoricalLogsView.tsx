import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Search,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  ListTodo,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  formatDateLabel,
  formatTimeRange,
  generateLogsCsv,
  triggerFileDownload,
} from '../../utils/calendarUtils';

interface HistoricalLogsViewProps {
  onOpenMeeting: (id: string) => void;
}

export const HistoricalLogsView: React.FC<HistoricalLogsViewProps> = ({ onOpenMeeting }) => {
  const { meetings, companies, clients, selectedCompanyId, setSelectedCompanyId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const clientMap = new Map(clients.map((cl) => [cl.id, cl]));

  // Historical or all meetings filtered by company
  const relevantMeetings = meetings.filter((m) => {
    if (selectedCompanyId !== 'ALL' && m.companyId !== selectedCompanyId) return false;
    return true;
  });

  // Calculate attendance statistics across meetings
  let totalAttendeesCount = 0;
  let attendedCount = 0;
  let tierATotalAttendees = 0;
  let tierAAttendedCount = 0;
  let totalActionItems = 0;
  let completedActionItems = 0;

  relevantMeetings.forEach((m) => {
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

  const overallAttendanceRate =
    totalAttendeesCount > 0 ? Math.round((attendedCount / totalAttendeesCount) * 100) : 0;
  const tierAAttendanceRate =
    tierATotalAttendees > 0 ? Math.round((tierAAttendedCount / tierATotalAttendees) * 100) : 0;
  const actionCompletionRate =
    totalActionItems > 0 ? Math.round((completedActionItems / totalActionItems) * 100) : 0;

  // Search and filter meetings
  const displayedMeetings = relevantMeetings.filter((m) => {
    const client = clientMap.get(m.clientId);
    const comp = companyMap.get(m.companyId);
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      m.title.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      (client && client.name.toLowerCase().includes(q)) ||
      (comp && comp.name.toLowerCase().includes(q));

    const matchesType = filterType === 'ALL' || m.meetingType === filterType;

    return matchesSearch && matchesType;
  });

  const handleExportCsv = () => {
    const csvData = generateLogsCsv(displayedMeetings, companies, clients);
    triggerFileDownload(csvData, 'omnical-historical-meeting-logs.csv', 'text/csv');
  };

  return (
    <div className="space-y-6">
      {/* Attendance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Overall Attendance Rate</span>
            <Users className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100 flex items-baseline gap-2">
            <span>{overallAttendanceRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">
              ({attendedCount}/{totalAttendeesCount} present)
            </span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${overallAttendanceRate}%` }}
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
            <span>{tierAAttendanceRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">High Quorum</span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${tierAAttendanceRate}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Historical Sessions Logged</span>
            <FileText className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100">
            {relevantMeetings.length}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Across {companies.length} secure company partitions
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Action Item Follow-Through</span>
            <ListTodo className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-neutral-100 flex items-baseline gap-2">
            <span>{actionCompletionRate}%</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">
              ({completedActionItems}/{totalActionItems} resolved)
            </span>
          </div>
          <div className="mt-2 w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${actionCompletionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search and Table Filters Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, attendees, notes..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Meeting Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-hidden"
          >
            <option value="ALL">All Meeting Types</option>
            <option value="Quarterly Review">Quarterly Review</option>
            <option value="Monthly Update">Monthly Update</option>
            <option value="Executive Follow-up">Executive Follow-up</option>
            <option value="Operational Check-in">Operational Check-in</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            Export Logs (CSV)
          </button>
        </div>
      </div>

      {/* Historical Logs High-Density Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Session Title & Client</th>
                <th className="py-3 px-4">Company Profile</th>
                <th className="py-3 px-4 text-center">Client Tier</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
                <th className="py-3 px-4 text-center">Notes Synced</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {displayedMeetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No historical logs matching filter.
                  </td>
                </tr>
              ) : (
                displayedMeetings.map((m) => {
                  const comp = companyMap.get(m.companyId);
                  const cli = clientMap.get(m.clientId);
                  const present = m.attendees.filter((a) => a.status === 'attended').length;
                  const total = m.attendees.length;
                  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-neutral-850/50 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono tabular-nums text-neutral-400 whitespace-nowrap">
                        <div className="text-neutral-200 font-medium">
                          {formatDateLabel(m.startTime)}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {formatTimeRange(m.startTime, m.endTime)}
                        </div>
                      </td>

                      {/* Title & Client */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onOpenMeeting(m.id)}
                          className="font-medium text-neutral-100 hover:text-indigo-400 cursor-pointer transition-colors"
                        >
                          {m.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {cli?.name || 'Client'} · {m.meetingType}
                        </div>
                      </td>

                      {/* Company Profile */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-neutral-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: comp?.accentHex || '#6366F1' }}
                          />
                          {comp?.name}
                        </span>
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

                      {/* Notes Sync Status */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-[11px]">
                          <span
                            title={
                              m.notes.preMeeting.syncedToAccount
                                ? 'Pre-meeting brief synced to account'
                                : 'Pre-meeting not synced'
                            }
                            className={
                              m.notes.preMeeting.syncedToAccount
                                ? 'text-emerald-400'
                                : 'text-neutral-600'
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
                              m.notes.postMeeting.syncedToAccount
                                ? 'text-emerald-400'
                                : 'text-neutral-600'
                            }
                          >
                            Post
                          </span>
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
