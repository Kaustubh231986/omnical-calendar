import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MeetingEvent, AttendanceStatus, ActionItem } from '../../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Send,
  Save,
  CheckCircle2,
  XCircle,
  Clock3,
  Building2,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  ListTodo,
  CheckSquare,
  Square,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { formatTimeRange, formatDateLabel } from '../../utils/calendarUtils';

interface MeetingDetailModalProps {
  meetingId: string | null;
  onClose: () => void;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ meetingId, onClose }) => {
  const {
    meetings,
    companies,
    clients,
    updateMeeting,
    updatePreNotes,
    updatePostNotes,
    sendPreMeetingBriefing,
    sendPostMeetingRecap,
    syncNotesToAccount,
    setAttendeeStatus,
    deleteMeeting,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'pre' | 'post' | 'audit'>('overview');
  const [newObjective, setNewObjective] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDue, setNewActionDue] = useState('2026-10-10');

  const meeting = meetings.find((m) => m.id === meetingId);
  if (!meeting) return null;

  const company = companies.find((c) => c.id === meeting.companyId);
  const client = clients.find((c) => c.id === meeting.clientId);

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    const current = meeting.notes.preMeeting.objectives || [];
    updatePreNotes(meeting.id, {
      objectives: [...current, newObjective.trim()],
    });
    setNewObjective('');
  };

  const handleRemoveObjective = (index: number) => {
    const current = [...(meeting.notes.preMeeting.objectives || [])];
    current.splice(index, 1);
    updatePreNotes(meeting.id, { objectives: current });
  };

  const handleAddDecision = () => {
    if (!newDecision.trim()) return;
    const current = meeting.notes.postMeeting.keyDecisions || [];
    updatePostNotes(meeting.id, {
      keyDecisions: [...current, newDecision.trim()],
    });
    setNewDecision('');
  };

  const handleRemoveDecision = (index: number) => {
    const current = [...(meeting.notes.postMeeting.keyDecisions || [])];
    current.splice(index, 1);
    updatePostNotes(meeting.id, { keyDecisions: current });
  };

  const handleAddActionItem = () => {
    if (!newActionTask.trim()) return;
    const current = meeting.notes.postMeeting.actionItems || [];
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim() || 'Team Lead',
      dueDate: newActionDue || '2026-10-15',
      completed: false,
    };
    updatePostNotes(meeting.id, {
      actionItems: [...current, newItem],
    });
    setNewActionTask('');
    setNewActionAssignee('');
  };

  const handleToggleActionCompleted = (itemId: string) => {
    const current = meeting.notes.postMeeting.actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updatePostNotes(meeting.id, { actionItems: current });
  };

  const handleRemoveActionItem = (itemId: string) => {
    const current = meeting.notes.postMeeting.actionItems.filter((item) => item.id !== itemId);
    updatePostNotes(meeting.id, { actionItems: current });
  };

  const attendedCount = meeting.attendees.filter((a) => a.status === 'attended').length;
  const totalAttendees = meeting.attendees.length;
  const attendanceRate = totalAttendees > 0 ? Math.round((attendedCount / totalAttendees) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-neutral-900">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1 font-medium text-neutral-300">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {company?.name || 'Company Profile'}
              </span>
              <span>·</span>
              <span className="text-neutral-400 font-mono text-[11px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                {company?.encryptionPartition || 'Isolated Partition'}
              </span>
              <span>·</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                {meeting.meetingType}
              </span>
              {client && (
                <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  Tier {client.tier}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-neutral-100">{meeting.title}</h2>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {formatDateLabel(meeting.startTime)}
              </span>
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {formatTimeRange(meeting.startTime, meeting.endTime)}
              </span>
              <span className="flex items-center gap-1 text-neutral-300 truncate max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                {meeting.location}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation bar */}
        <div className="flex items-center px-5 border-b border-neutral-800 bg-neutral-900/60 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Attendees & Attendance ({attendedCount}/{totalAttendees})
          </button>
          <button
            onClick={() => setActiveTab('pre')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pre'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Pre-Meeting Briefing
            {meeting.notes.preMeeting.sentToAttendees && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'post'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Post-Meeting Recap & Action Items
            {meeting.notes.postMeeting.actionItems.length > 0 && (
              <span className="px-1.5 py-0.2 bg-neutral-800 rounded text-[10px] font-mono">
                {meeting.notes.postMeeting.actionItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Account Sync Logs
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-5 text-neutral-200 text-sm">
          {/* TAB 1: OVERVIEW & ATTENDANCE */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 mb-1">Description & Context</h4>
                <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {meeting.description || 'No description provided.'}
                </p>
              </div>

              {/* Attendance metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div className="text-xs text-neutral-400">Attendance Rate</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-neutral-100 mt-1">
                    {attendanceRate}%
                  </div>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div className="text-xs text-neutral-400">Confirmed Present</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                    {attendedCount} / {totalAttendees}
                  </div>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <div className="text-xs text-neutral-400">Status</div>
                  <div className="text-xs font-semibold text-indigo-400 mt-2 capitalize flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    {meeting.status}
                  </div>
                </div>
              </div>

              {/* Attendees list with attendance marking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-neutral-300">
                    Attendees & Quorum Verification ({totalAttendees})
                  </h4>
                  <span className="text-[11px] text-neutral-400">
                    Click status to mark attendance for historical record
                  </span>
                </div>

                <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 bg-neutral-950">
                  {meeting.attendees.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-neutral-900/40"
                    >
                      <div>
                        <div className="font-medium text-neutral-100">{att.name}</div>
                        <div className="text-neutral-400 text-[11px]">
                          {att.email} · {att.company}
                        </div>
                      </div>

                      {/* Attendance toggles */}
                      <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                        <button
                          onClick={() => setAttendeeStatus(meeting.id, att.id, 'attended')}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                            att.status === 'attended'
                              ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Attended
                        </button>
                        <button
                          onClick={() => setAttendeeStatus(meeting.id, att.id, 'absent')}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                            att.status === 'absent'
                              ? 'bg-rose-500/20 text-rose-300 font-semibold'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Absent
                        </button>
                        <button
                          onClick={() => setAttendeeStatus(meeting.id, att.id, 'pending')}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                            att.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 font-semibold'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Clock3 className="w-3 h-3 text-amber-400" />
                          Pending
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-MEETING BRIEFING & NOTES */}
          {activeTab === 'pre' && (
            <div className="space-y-5">
              {/* Dispatch & Sync Status Banner */}
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-200">Pre-Meeting Record Status:</span>
                    {meeting.notes.preMeeting.sentToAttendees ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Sent to attendees ({meeting.notes.preMeeting.sentTimestamp ? new Date(meeting.notes.preMeeting.sentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged'})
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px]">Not dispatched yet</span>
                    )}
                    <span>·</span>
                    {meeting.notes.preMeeting.syncedToAccount ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Synced to {company?.name || 'Account'}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">Pending account sync</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      Sender Mailbox:
                    </span>
                    <span className="text-neutral-200">
                      {company?.emailConfig?.senderEmail || company?.accountExecutive.email}
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400 font-sans">
                      (Isolated for {company?.name})
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Pre-meeting notes ensure seamless record-keeping and advance context before sessions start.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendPreMeetingBriefing(meeting.id)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    Dispatch Briefing to Attendees
                  </button>
                  <button
                    onClick={() => syncNotesToAccount(meeting.id, 'pre')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync to Account Profile
                  </button>
                </div>
              </div>

              {/* Agenda Editor */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Pre-Meeting Agenda
                </label>
                <textarea
                  rows={4}
                  value={meeting.notes.preMeeting.agenda}
                  onChange={(e) => updatePreNotes(meeting.id, { agenda: e.target.value })}
                  placeholder="Outline the meeting agenda items..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                />
              </div>

              {/* Objectives List */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Key Objectives & Target Outcomes
                </label>
                <div className="space-y-1.5 mb-2">
                  {(meeting.notes.preMeeting.objectives || []).map((obj, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded text-xs"
                    >
                      <span className="text-neutral-200">
                        {i + 1}. {obj}
                      </span>
                      <button
                        onClick={() => handleRemoveObjective(i)}
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddObjective()}
                    placeholder="Add an objective (e.g. Confirm Q4 budget allocation)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddObjective}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Talking Points */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Internal Talking Points & Sensitivity Notes
                </label>
                <textarea
                  rows={2}
                  value={meeting.notes.preMeeting.talkingPoints}
                  onChange={(e) => updatePreNotes(meeting.id, { talkingPoints: e.target.value })}
                  placeholder="Private talking points for the internal account team..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: POST-MEETING RECAP & ACTIONS */}
          {activeTab === 'post' && (
            <div className="space-y-5">
              {/* Dispatch & Sync Status Banner */}
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-200">Post-Meeting Record Status:</span>
                    {meeting.notes.postMeeting.sentToAttendees ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Recap emailed to attendees
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px]">Recap pending dispatch</span>
                    )}
                    <span>·</span>
                    {meeting.notes.postMeeting.syncedToAccount ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Synced to {company?.name || 'Account'}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">Pending account sync</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1 text-indigo-300">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      Sender Mailbox:
                    </span>
                    <span className="text-neutral-200">
                      {company?.emailConfig?.senderEmail || company?.accountExecutive.email}
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400 font-sans">
                      (CC: {company?.emailConfig?.ccList.join(', ') || company?.accountExecutive.email})
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Post-meeting recaps capture binding decisions and actionable commitments across company accounts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendPostMeetingRecap(meeting.id)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    Dispatch Recap to Attendees
                  </button>
                  <button
                    onClick={() => syncNotesToAccount(meeting.id, 'post')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Notes to Account Profile
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Executive Summary & Meeting Outcomes
                </label>
                <textarea
                  rows={3}
                  value={meeting.notes.postMeeting.summary}
                  onChange={(e) => updatePostNotes(meeting.id, { summary: e.target.value })}
                  placeholder="Summarize the core discussion, outcomes, and stakeholder reactions..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Key Decisions */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Key Decisions Agreed Upon
                </label>
                <div className="space-y-1.5 mb-2">
                  {(meeting.notes.postMeeting.keyDecisions || []).map((dec, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded text-xs"
                    >
                      <span className="text-neutral-200">
                        {i + 1}. {dec}
                      </span>
                      <button
                        onClick={() => handleRemoveDecision(i)}
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDecision()}
                    placeholder="Add a decision (e.g. Authorized Q4 compute node procurement)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddDecision}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Action Items List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300">
                    Action Items & Assignees ({meeting.notes.postMeeting.actionItems.length})
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Synced automatically with CRM task trackers
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {meeting.notes.postMeeting.actionItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                        item.completed
                          ? 'bg-neutral-950/60 border-neutral-800 text-neutral-500'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleActionCompleted(item.id)}
                          className="text-neutral-400 hover:text-indigo-400 cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`truncate ${item.completed ? 'line-through text-neutral-500' : ''}`}>
                          {item.task}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="text-neutral-400 font-medium">{item.assignee}</span>
                        <span className="font-mono tabular-nums text-neutral-500">
                          Due: {item.dueDate}
                        </span>
                        <button
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new action item form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="Action item task description..."
                    className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={newActionAssignee}
                    onChange={(e) => setNewActionAssignee(e.target.value)}
                    placeholder="Assignee name"
                    className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
                  />
                  <button
                    onClick={handleAddActionItem}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium border border-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Follow-up commitment */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Follow-up Commitment & Next Steps
                </label>
                <input
                  type="text"
                  value={meeting.notes.postMeeting.followUpCommitment}
                  onChange={(e) => updatePostNotes(meeting.id, { followUpCommitment: e.target.value })}
                  placeholder="e.g. Deliver benchmark latency report by Wednesday 5 PM..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT SYNC LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300">
                    Two-Way Account Sync Audit Log
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Cryptographically isolated synchronization ledger for {company?.name}
                  </p>
                </div>
                <button
                  onClick={() => syncNotesToAccount(meeting.id, 'both')}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  Force Full Account Sync
                </button>
              </div>

              <div className="border border-neutral-800 rounded-lg overflow-hidden divide-y divide-neutral-800 bg-neutral-950 font-mono text-xs">
                {(meeting.syncLogs || []).map((log) => (
                  <div key={log.id} className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-neutral-200">{log.action}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-sans">{log.details}</p>
                    </div>
                    <span className="text-[11px] text-neutral-500 shrink-0 tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to remove this scheduled meeting?')) {
                deleteMeeting(meeting.id);
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Entry
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
