import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ActionItem,
  CadenceFrequency,
  DealEngagementType,
  MeetingScope,
  MeetingType,
} from '../../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Send,
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
  Pencil,
  AlertTriangle,
  Repeat,
  Zap,
  Forward,
  Layers,
  Briefcase,
} from 'lucide-react';
import {
  formatTimeRange,
  formatDateLabel,
  formatCadenceLabel,
  RECURRING_CADENCE_OPTIONS,
  computeNextRescheduleSlot,
  isMeetingOverdueUnheld,
  doesClientBelongToCompany,
} from '../../utils/calendarUtils';

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
    forwardPostMeetingMail,
    syncNotesToAccount,
    setAttendeeStatus,
    rescheduleMeeting,
    markMeetingMissed,
    deleteMeeting,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'pre' | 'post' | 'audit'>('overview');
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  // Pre / Post inputs
  const [newObjective, setNewObjective] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionEmail, setNewActionEmail] = useState('');
  const [newActionDue, setNewActionDue] = useState('2026-12-05');

  // Custom reschedule state
  const [customDate, setCustomDate] = useState('');
  const [customStart, setCustomStart] = useState('10:00');
  const [customEnd, setCustomEnd] = useState('11:00');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Company-wise CC & Forward Work Mail state
  const [forwardToInput, setForwardToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [forwardNote, setForwardNote] = useState('');
  const [forwardFeedback, setForwardFeedback] = useState<string | null>(null);

  // Edit Meeting Form State
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    companyId: string;
    departmentId: string;
    clientId: string;
    scope: MeetingScope;
    serviceScope: string;
    engagementType: DealEngagementType;
    cadence: CadenceFrequency;
    meetingType: MeetingType;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'missed';
    autoRescheduleEnabled: boolean;
  } | null>(null);

  const meeting = meetings.find((m) => m.id === meetingId);
  const company = companies.find((c) => c.id === meeting?.companyId);
  const client = clients.find((c) => c.id === meeting?.clientId);

  // Initialize edit form & company-wise CC/Forward defaults when meeting changes
  useEffect(() => {
    if (!meeting) return;
    setIsEditingDetails(false);
    setForwardFeedback(null);

    const startObj = new Date(meeting.startTime);
    const endObj = new Date(meeting.endTime);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = meeting.startTime.slice(0, 10);
    const startHM = `${pad(startObj.getHours())}:${pad(startObj.getMinutes())}`;
    const endHM = `${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

    setEditForm({
      title: meeting.title,
      description: meeting.description,
      companyId: meeting.companyId,
      departmentId: meeting.departmentId || '',
      clientId: meeting.clientId,
      scope: meeting.scope || 'client',
      serviceScope: meeting.serviceScope || '',
      engagementType: meeting.engagementType || 'recurring',
      cadence: meeting.cadence || 'monthly',
      meetingType: meeting.meetingType,
      date: dateStr,
      startTime: startHM,
      endTime: endHM,
      location: meeting.location,
      status: meeting.status,
      autoRescheduleEnabled: meeting.autoRescheduleEnabled ?? true,
    });

    // Suggested next reschedule slot defaults
    const suggested = computeNextRescheduleSlot(
      meeting.startTime,
      meeting.endTime,
      meeting.cadence,
      new Date()
    );
    setCustomDate(suggested.startTime.slice(0, 10));
    setCustomStart(suggested.startTime.slice(11, 16));
    setCustomEnd(suggested.endTime.slice(11, 16));

    // Pre-fill company-wise default CC & work assignees
    const comp = companies.find((c) => c.id === meeting.companyId);
    const defaultCcSet = new Set<string>([
      ...(comp?.emailConfig?.ccList || []),
      ...(comp?.workAssignees?.filter((w) => w.defaultCc).map((w) => w.email) || []),
    ]);
    setCcInput(Array.from(defaultCcSet).join(', '));

    const actionEmails = meeting.notes.postMeeting.actionItems
      .map((a) => a.assigneeEmail)
      .filter(Boolean) as string[];
    setForwardToInput(Array.from(new Set(actionEmails)).join(', '));
    setForwardNote(
      `Meeting completed with ${
        clients.find((cl) => cl.id === meeting.clientId)?.name || 'client'
      } under ${comp?.name || 'company'}. Please review the summary and execute your assigned work items.`
    );
  }, [meetingId]);

  const suggestedSlot = useMemo(() => {
    if (!meeting) return null;
    return computeNextRescheduleSlot(
      meeting.startTime,
      meeting.endTime,
      meeting.cadence,
      new Date()
    );
  }, [meeting]);

  if (!meeting) return null;

  const department = company?.departments?.find((d) => d.id === meeting.departmentId);
  const isOverdue = isMeetingOverdueUnheld(meeting, new Date());
  const needsRescheduleAttention = meeting.status === 'missed' || isOverdue;

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    const newStart = `${editForm.date}T${editForm.startTime}:00`;
    const newEnd = `${editForm.date}T${editForm.endTime}:00`;
    const timeChanged =
      newStart.slice(0, 16) !== meeting.startTime.slice(0, 16) ||
      newEnd.slice(0, 16) !== meeting.endTime.slice(0, 16);

    updateMeeting(meeting.id, {
      title: editForm.title.trim() || meeting.title,
      description: editForm.description.trim(),
      companyId: editForm.companyId,
      departmentId: editForm.departmentId || undefined,
      clientId: editForm.scope === 'client' ? editForm.clientId : '',
      scope: editForm.scope,
      serviceScope: editForm.serviceScope.trim() || undefined,
      engagementType: editForm.engagementType,
      cadence: editForm.engagementType === 'one_time' ? 'one_time' : editForm.cadence,
      meetingType: editForm.meetingType,
      startTime: newStart,
      endTime: newEnd,
      location: editForm.location.trim(),
      status: editForm.status,
      autoRescheduleEnabled: editForm.autoRescheduleEnabled,
      ...(timeChanged && !meeting.originalStartTime
        ? { originalStartTime: meeting.startTime, originalEndTime: meeting.endTime }
        : {}),
    });
    setIsEditingDetails(false);
  };

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
    const matchedStaff = company?.workAssignees?.find(
      (w) => w.name.toLowerCase() === newActionAssignee.trim().toLowerCase()
    );
    const emailToUse = newActionEmail.trim() || matchedStaff?.email;
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim() || 'Team Lead',
      assigneeEmail: emailToUse || undefined,
      dueDate: newActionDue || '2026-12-10',
      completed: false,
    };
    updatePostNotes(meeting.id, {
      actionItems: [...current, newItem],
    });
    if (emailToUse) {
      const existing = forwardToInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!existing.includes(emailToUse)) {
        setForwardToInput([...existing, emailToUse].join(', '));
      }
    }
    setNewActionTask('');
    setNewActionAssignee('');
    setNewActionEmail('');
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

  const toggleEmailInList = (email: string, listStr: string, setter: (val: string) => void) => {
    const arr = listStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.includes(email)) {
      setter(arr.filter((e) => e !== email).join(', '));
    } else {
      setter([...arr, email].join(', '));
    }
  };

  const handleForwardWorkMail = () => {
    const toEmails = forwardToInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ccEmails = ccInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (toEmails.length === 0 && ccEmails.length === 0) {
      setForwardFeedback('Please select or enter at least one recipient (Forward To or CC).');
      return;
    }

    forwardPostMeetingMail(meeting.id, {
      toEmails,
      ccEmails,
      note: forwardNote.trim(),
    });
    setForwardFeedback(
      `Dispatched from ${company?.name || 'Company'} mailbox (${
        company?.emailConfig?.senderEmail || company?.accountExecutive.email
      }) to ${toEmails.length} assignee(s) with ${ccEmails.length} CC recipient(s).`
    );
  };

  const attendedCount = meeting.attendees.filter((a) => a.status === 'attended').length;
  const totalAttendees = meeting.attendees.length;
  const attendanceRate = totalAttendees > 0 ? Math.round((attendedCount / totalAttendees) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-3 bg-neutral-900">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1 font-medium text-neutral-200">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {company?.name || 'Company Profile'}
              </span>
              {department && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" />
                  {department.name}
                </span>
              )}
              {meeting.engagementType === 'one_time' ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  One-Time Deal
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <Repeat className="w-2.5 h-2.5" />
                  {formatCadenceLabel(meeting.cadence)}
                </span>
              )}
              {client && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  Tier {client.tier}
                </span>
              )}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                  meeting.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : meeting.status === 'missed'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                }`}
              >
                {meeting.status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-neutral-100">{meeting.title}</h2>
            {meeting.serviceScope && (
              <div className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3 h-3" />
                Service Scope: {meeting.serviceScope}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1 font-mono tabular-nums text-neutral-200">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                {formatDateLabel(meeting.startTime)}
              </span>
              <span className="flex items-center gap-1 font-mono tabular-nums text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                {formatTimeRange(meeting.startTime, meeting.endTime)}
              </span>
              <span className="flex items-center gap-1 text-neutral-300 truncate max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                {meeting.location}
              </span>
            </div>

            {meeting.originalStartTime && (
              <div className="mt-2 inline-flex flex-wrap items-center gap-2 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 font-mono">
                <span>
                  {meeting.autoRescheduled ? 'Auto-Rescheduled' : 'Rescheduled'} from Original:{' '}
                  {formatDateLabel(meeting.originalStartTime)}{' '}
                  {meeting.originalEndTime
                    ? formatTimeRange(meeting.originalStartTime, meeting.originalEndTime)
                    : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsEditingDetails(!isEditingDetails);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors cursor-pointer ${
                isEditingDetails
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditingDetails ? 'Editing' : 'Modify'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation bar */}
        <div className="flex flex-wrap items-center px-5 border-b border-neutral-800 bg-neutral-900/60 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Overview &amp; Reschedule ({attendedCount}/{totalAttendees})
          </button>
          <button
            onClick={() => setActiveTab('pre')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pre'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Pre-Meeting
            {meeting.notes.preMeeting.sentToAttendees && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'post'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Post-Meeting &amp; CC/Forward Work
            {meeting.notes.postMeeting.actionItems.length > 0 && (
              <span className="px-1.5 py-0.2 bg-neutral-800 rounded text-[10px] font-mono">
                {meeting.notes.postMeeting.actionItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-500 text-neutral-100'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit Logs
          </button>
        </div>

        {/* Modal content body */}
        <div className="flex-1 overflow-y-auto p-5 text-neutral-200 text-sm">
          {/* TAB 1: OVERVIEW, EDIT & MISSED / AUTO-RESCHEDULE */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Modify Meeting Details Form */}
              {isEditingDetails && editForm && (
                <form
                  onSubmit={handleSaveEdits}
                  className="bg-neutral-950 border border-indigo-500/40 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="font-semibold text-indigo-300 flex items-center justify-between">
                    <span>Modify Meeting Information & Schedule</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-neutral-400 mb-1">Meeting Title</label>
                      <input
                        type="text"
                        required
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Company Profile</label>
                      <select
                        value={editForm.companyId}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            companyId: e.target.value,
                            departmentId: '',
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Department</label>
                      <select
                        value={editForm.departmentId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, departmentId: e.target.value })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        <option value="">Company-wide</option>
                        {(
                          companies.find((c) => c.id === editForm.companyId)?.departments || []
                        ).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Scope</label>
                      <select
                        value={editForm.scope}
                        onChange={(e) =>
                          setEditForm({ ...editForm, scope: e.target.value as MeetingScope })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        <option value="client">Client Meeting</option>
                        <option value="company">Company Meeting</option>
                        <option value="department">Department Meeting</option>
                      </select>
                    </div>

                    {editForm.scope === 'client' && (
                      <div>
                        <label className="block text-neutral-400 mb-1">Client Account</label>
                        <select
                          value={editForm.clientId}
                          onChange={(e) =>
                            setEditForm({ ...editForm, clientId: e.target.value })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                        >
                          {clients
                            .filter((c) => doesClientBelongToCompany(c, editForm.companyId))
                            .map((cl) => (
                              <option key={cl.id} value={cl.id}>
                                {cl.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-neutral-400 mb-1">Deal Type</label>
                      <select
                        value={editForm.engagementType}
                        onChange={(e) => {
                          const t = e.target.value as DealEngagementType;
                          setEditForm({
                            ...editForm,
                            engagementType: t,
                            cadence:
                              t === 'one_time'
                                ? 'one_time'
                                : editForm.cadence === 'one_time'
                                ? 'monthly'
                                : editForm.cadence,
                          });
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        <option value="recurring">Recurring</option>
                        <option value="one_time">One-Time Deal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Frequency Cadence</label>
                      <select
                        value={editForm.cadence}
                        disabled={editForm.engagementType === 'one_time'}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            cadence: e.target.value as CadenceFrequency,
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 disabled:opacity-60"
                      >
                        {editForm.engagementType === 'one_time' ? (
                          <option value="one_time">One-Time Deal</option>
                        ) : (
                          RECURRING_CADENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Date</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-400 mb-1">Start</label>
                        <input
                          type="time"
                          value={editForm.startTime}
                          onChange={(e) =>
                            setEditForm({ ...editForm, startTime: e.target.value })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-neutral-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">End</label>
                        <input
                          type="time"
                          value={editForm.endTime}
                          onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-neutral-200 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Service Scope</label>
                      <input
                        type="text"
                        value={editForm.serviceScope}
                        onChange={(e) =>
                          setEditForm({ ...editForm, serviceScope: e.target.value })
                        }
                        placeholder="e.g. Financial Planning"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Location / URL</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer"
                    >
                      Save Meeting Changes
                    </button>
                  </div>
                </form>
              )}

              {/* Missed / Overdue Auto-Reschedule Banner */}
              {needsRescheduleAttention && suggestedSlot && (
                <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        {meeting.status === 'missed'
                          ? 'Scheduled Meeting Did Not Happen (Missed)'
                          : 'Scheduled Meeting Time Passed Without Completion'}
                      </div>
                      <p className="text-neutral-300">
                        Scheduled slot:{' '}
                        <span className="font-mono text-neutral-100">
                          {formatDateLabel(meeting.startTime)} ·{' '}
                          {formatTimeRange(meeting.startTime, meeting.endTime)}
                        </span>
                      </p>
                      <p className="text-emerald-300 font-mono text-[11px]">
                        Recommended Next Slot ({formatCadenceLabel(meeting.cadence)}):{' '}
                        {formatDateLabel(suggestedSlot.startTime)} ·{' '}
                        {formatTimeRange(suggestedSlot.startTime, suggestedSlot.endTime)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        rescheduleMeeting(meeting.id, {
                          auto: true,
                          reason: 'Automatically moved to next valid cadence date/time',
                        })
                      }
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Auto-Reschedule Now
                    </button>
                  </div>

                  {/* Manual Reschedule Picker */}
                  <div className="pt-2.5 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Custom Date</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Start</label>
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">End</label>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Reason</label>
                      <input
                        type="text"
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        placeholder="Client requested..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-neutral-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        rescheduleMeeting(meeting.id, {
                          auto: false,
                          customStartTime: `${customDate}T${customStart}:00`,
                          customEndTime: `${customDate}T${customEnd}:00`,
                          reason: rescheduleReason || 'Custom rescheduled slot',
                        })
                      }
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 font-medium cursor-pointer"
                    >
                      Set Custom Slot
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-neutral-400 mb-1">Description &amp; Context</h4>
                <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {meeting.description || 'No description provided.'}
                </p>
              </div>

              {/* Status & Quick Lifecycle Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2">
                  <div className="text-xs text-neutral-400">Meeting Outcome Actions</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        updateMeeting(meeting.id, { status: 'completed' });
                        setActiveTab('post');
                      }}
                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-medium cursor-pointer"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => markMeetingMissed(meeting.id, false)}
                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded text-[11px] font-medium cursor-pointer"
                    >
                      Did Not Happen
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendees list with attendance marking */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-neutral-300">
                    Attendees &amp; Quorum Verification ({totalAttendees})
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

                      <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded border border-neutral-800">
                        <button
                          onClick={() => setAttendeeStatus(meeting.id, att.id, 'attended')}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
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
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
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
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
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
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-200">Pre-Meeting Record Status:</span>
                    {meeting.notes.preMeeting.sentToAttendees ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Sent to attendees
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
                    <Mail className="w-3 h-3 text-indigo-400" />
                    <span>
                      {company?.emailConfig?.senderEmail || company?.accountExecutive.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendPreMeetingBriefing(meeting.id)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    Dispatch Briefing
                  </button>
                  <button
                    onClick={() => syncNotesToAccount(meeting.id, 'pre')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync to Account
                  </button>
                </div>
              </div>

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

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Key Objectives &amp; Target Outcomes
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
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded cursor-pointer"
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
                    placeholder="Add an objective..."
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

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Internal Talking Points &amp; Sensitivity Notes
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

          {/* TAB 3: POST-MEETING RECAP, ACTION ITEMS & COMPANY-WISE CC/FORWARD */}
          {activeTab === 'post' && (
            <div className="space-y-5">
              {/* Dispatch & Sync Status Banner */}
              <div className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-neutral-200">Post-Meeting Status:</span>
                    {meeting.notes.postMeeting.sentToAttendees ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Recap dispatched
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
                      <span className="text-neutral-400 text-[11px]">Pending sync</span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">
                    Company Mailbox:{' '}
                    <span className="text-neutral-200">
                      {company?.emailConfig?.senderEmail || company?.accountExecutive.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendPostMeetingRecap(meeting.id)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    Send to Attendees
                  </button>
                  <button
                    onClick={() => syncNotesToAccount(meeting.id, 'post')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync Notes
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Executive Summary &amp; Meeting Outcomes
                </label>
                <textarea
                  rows={3}
                  value={meeting.notes.postMeeting.summary}
                  onChange={(e) => updatePostNotes(meeting.id, { summary: e.target.value })}
                  placeholder="Summarize discussion, outcomes, and client commitments..."
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
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded cursor-pointer"
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
                    placeholder="Add a decision..."
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
                    Assigned Work / Action Items ({meeting.notes.postMeeting.actionItems.length})
                  </label>
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

                      <div className="flex items-center gap-2.5 shrink-0 text-[11px]">
                        <span className="text-indigo-300 font-medium">
                          {item.assignee}
                          {item.assigneeEmail ? ` (${item.assigneeEmail})` : ''}
                        </span>
                        <span className="font-mono tabular-nums text-neutral-500">
                          Due: {item.dueDate}
                        </span>
                        <button
                          onClick={() => handleRemoveActionItem(item.id)}
                          className="text-neutral-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new action item form */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="Work task description..."
                    className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={newActionAssignee}
                    onChange={(e) => setNewActionAssignee(e.target.value)}
                    list={`staff-list-${meeting.companyId}`}
                    placeholder="Assignee name"
                    className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
                  />
                  <datalist id={`staff-list-${meeting.companyId}`}>
                    {(company?.workAssignees || []).map((w) => (
                      <option key={w.id} value={w.name} />
                    ))}
                  </datalist>
                  <input
                    type="email"
                    value={newActionEmail}
                    onChange={(e) => setNewActionEmail(e.target.value)}
                    placeholder="Assignee email"
                    className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium border border-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Assign
                  </button>
                </div>
              </div>

              {/* COMPANY-WISE CC & FORWARD WORK EMAIL PANEL */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Forward className="w-4 h-4" />
                      CC / Forward Post-Meeting Work Mail ({company?.name})
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Once the client meeting is over, forward action items or CC assigned team members strictly under {company?.name}&apos;s mailbox.
                    </p>
                  </div>
                </div>

                {/* Company Work Assignees Quick Chips */}
                {(company?.workAssignees || []).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-neutral-400 font-medium">
                      {company?.name} Work Assignees &amp; Staff (click to toggle To / CC):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(company?.workAssignees || []).map((staff) => {
                        const inTo = forwardToInput.includes(staff.email);
                        const inCc = ccInput.includes(staff.email);
                        return (
                          <div
                            key={staff.id}
                            className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-[11px]"
                          >
                            <span className="text-neutral-200 font-medium">{staff.name}</span>
                            <span className="text-neutral-500 font-mono">({staff.role})</span>
                            <button
                              type="button"
                              onClick={() =>
                                toggleEmailInList(staff.email, forwardToInput, setForwardToInput)
                              }
                              className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono cursor-pointer ${
                                inTo
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              To
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleEmailInList(staff.email, ccInput, setCcInput)}
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono cursor-pointer ${
                                inCc
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              CC
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-300 font-medium mb-1">
                      Forward To (Work Assignees Emails)
                    </label>
                    <input
                      type="text"
                      value={forwardToInput}
                      onChange={(e) => setForwardToInput(e.target.value)}
                      placeholder="assignee1@company.com, assignee2@company.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-300 font-medium mb-1">
                      CC Recipients ({company?.name} Team)
                    </label>
                    <input
                      type="text"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      placeholder="lead@company.com, ops@company.com"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-300 font-medium mb-1">
                    Work Assignment / Forwarding Note
                  </label>
                  <textarea
                    rows={2}
                    value={forwardNote}
                    onChange={(e) => setForwardNote(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {forwardFeedback ? (
                    <span className="text-[11px] text-emerald-300 font-medium">
                      {forwardFeedback}
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-500">
                      Sends post-meeting minutes + action items strictly via {company?.name}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleForwardWorkMail}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Forward className="w-3.5 h-3.5" />
                    Forward / CC Work Email
                  </button>
                </div>

                {/* History of Forwarded / CC'd Work Emails */}
                {(meeting.notes.postMeeting.forwardedRecords || []).length > 0 && (
                  <div className="pt-2 border-t border-indigo-500/20 space-y-1.5">
                    <div className="text-[11px] font-semibold text-neutral-300">
                      Company-Wise Dispatch Log ({meeting.notes.postMeeting.forwardedRecords?.length})
                    </div>
                    {(meeting.notes.postMeeting.forwardedRecords || []).map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2 rounded bg-neutral-950 border border-neutral-800 text-[11px] space-y-0.5 font-mono"
                      >
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>Sent from {rec.senderEmail}</span>
                          <span className="text-neutral-500">
                            {new Date(rec.sentAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-neutral-300">
                          To: {rec.to.join(', ') || '—'} · CC: {rec.cc.join(', ') || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-up commitment */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Follow-up Commitment &amp; Next Steps
                </label>
                <input
                  type="text"
                  value={meeting.notes.postMeeting.followUpCommitment}
                  onChange={(e) => updatePostNotes(meeting.id, { followUpCommitment: e.target.value })}
                  placeholder="e.g. Deliver final proposal by Wednesday 5 PM..."
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
                    Two-Way Account Sync &amp; Reschedule Audit Log
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
                {(meeting.syncLogs || []).length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 font-sans">
                    No sync or forwarding events logged yet for this meeting.
                  </div>
                ) : (
                  (meeting.syncLogs || []).map((log) => (
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
                  ))
                )}
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

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
