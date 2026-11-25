import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MeetingType,
  Attendee,
  MeetingScope,
  DealEngagementType,
  CadenceFrequency,
} from '../../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Plus,
  Trash2,
  Layers,
  Repeat,
  Zap,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { AddClientModal } from '../clients/AddClientModal';
import {
  formatDateIso,
  doesClientBelongToCompany,
  getClientCompanyLinks,
  getClientLinkForCompany,
  RECURRING_CADENCE_OPTIONS,
  formatCadenceLabel,
} from '../../utils/calendarUtils';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialCompanyId?: string;
  initialClientId?: string;
  initialDepartmentId?: string;
  initialScope?: MeetingScope;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialCompanyId,
  initialClientId,
  initialDepartmentId,
  initialScope,
}) => {
  const { companies, clients, addMeeting, selectedCompanyId } = useApp();

  const resolveDefaultCompany = () => {
    if (initialCompanyId && initialCompanyId !== 'ALL') return initialCompanyId;
    if (selectedCompanyId !== 'ALL') return selectedCompanyId;
    return companies[0]?.id || '';
  };

  const [scope, setScope] = useState<MeetingScope>(initialScope || 'client');
  const [companyId, setCompanyId] = useState(resolveDefaultCompany);
  const [departmentId, setDepartmentId] = useState<string>(initialDepartmentId || '');
  const [clientId, setClientId] = useState<string>(initialClientId || '');
  const [serviceScope, setServiceScope] = useState<string>('');
  const [engagementType, setEngagementType] = useState<DealEngagementType>('recurring');
  const [cadence, setCadence] = useState<CadenceFrequency>('monthly');
  const [repeatOccurrences, setRepeatOccurrences] = useState<number>(1);
  const [autoRescheduleEnabled, setAutoRescheduleEnabled] = useState<boolean>(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Monthly Update');
  const [date, setDate] = useState(() => initialDate || formatDateIso(new Date()));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('Google Meet · meet.google.com/omni-cadence');
  const [agenda, setAgenda] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttName, setNewAttName] = useState('');
  const [newAttEmail, setNewAttEmail] = useState('');

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );

  // Clients linked to the currently selected company
  const availableClients = useMemo(
    () => clients.filter((c) => doesClientBelongToCompany(c, companyId)),
    [clients, companyId]
  );

  // Reset / apply prefill props when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDate(initialDate || formatDateIso(new Date()));
    setScope(initialScope || 'client');
    const resolvedComp = resolveDefaultCompany();
    setCompanyId(resolvedComp);
    setDepartmentId(initialDepartmentId || '');
    setRepeatOccurrences(1);
    setAutoRescheduleEnabled(true);

    if (initialClientId) {
      setClientId(initialClientId);
    } else {
      const firstForComp = clients.find((c) => doesClientBelongToCompany(c, resolvedComp));
      setClientId(firstForComp?.id || '');
    }
  }, [isOpen, initialDate, initialCompanyId, initialClientId, initialDepartmentId, initialScope, selectedCompanyId]);

  // Keep clientId valid when company changes in client scope
  useEffect(() => {
    if (!isOpen) return;
    if (scope !== 'client') return;
    const stillValid = availableClients.some((c) => c.id === clientId);
    if (!stillValid) {
      setClientId(availableClients[0]?.id || '');
    }
  }, [companyId, availableClients, clientId, scope, isOpen]);

  // Auto-sync serviceScope, engagementType, cadence, department, title, and attendees
  useEffect(() => {
    if (!isOpen) return;
    const comp = companies.find((c) => c.id === companyId);
    const dept = comp?.departments?.find((d) => d.id === departmentId);
    const client = clients.find((c) => c.id === clientId);

    const initialList: Attendee[] = [];
    if (comp) {
      initialList.push({
        id: `att-comp-${Date.now()}`,
        name: comp.accountExecutive.name,
        email: comp.accountExecutive.email,
        company: comp.name,
        status: 'attended',
      });
    }

    if (scope === 'client' && client) {
      const link = getClientLinkForCompany(client, companyId);
      if (link) {
        setServiceScope(link.serviceScope);
        setEngagementType(link.engagementType);
        setCadence(link.cadence);
        if (link.departmentId && !initialDepartmentId) {
          setDepartmentId(link.departmentId);
        }
      } else {
        setServiceScope(client.industry || 'Advisory');
      }

      initialList.push({
        id: `att-cli-${Date.now() + 1}`,
        name: client.contact.name,
        email: client.contact.email,
        company: client.name,
        status: 'pending',
      });

      const svcLabel = link?.serviceScope ? ` (${link.serviceScope})` : '';
      setTitle(`${client.name} · ${comp?.name || 'Company'}${svcLabel}`);
    } else if (scope === 'department') {
      const activeDept = dept || comp?.departments?.[0];
      if (activeDept) {
        if (!departmentId) setDepartmentId(activeDept.id);
        setCadence(activeDept.meetingCadence);
        setEngagementType('recurring');
        setServiceScope(activeDept.name);
        setTitle(`[Dept: ${activeDept.name}] ${comp?.name || ''} ${formatCadenceLabel(activeDept.meetingCadence)} Sync`);
        if (activeDept.headEmail && activeDept.headEmail !== comp?.accountExecutive.email) {
          initialList.push({
            id: `att-dept-${Date.now() + 2}`,
            name: activeDept.headName,
            email: activeDept.headEmail,
            company: comp?.name || 'Department',
            status: 'pending',
          });
        }
      } else {
        setTitle(`${comp?.name || 'Company'} · Department Meeting`);
      }
    } else if (scope === 'company') {
      const compCadence = comp?.meetingCadence || 'monthly';
      setEngagementType('recurring');
      setCadence(compCadence);
      setServiceScope('Company-Wide Alignment');
      setTitle(`${comp?.name || 'Company'} · ${formatCadenceLabel(compCadence)} All-Hands Review`);
      (comp?.workAssignees || []).forEach((w, idx) => {
        if (w.email !== comp?.accountExecutive.email) {
          initialList.push({
            id: `att-staff-${Date.now() + idx + 3}`,
            name: w.name,
            email: w.email,
            company: comp?.name || 'Internal Team',
            status: 'pending',
          });
        }
      });
    }

    setAttendees(initialList);
  }, [companyId, clientId, departmentId, scope, isOpen]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedClientLinks = selectedClient ? getClientCompanyLinks(selectedClient) : [];

  const handleAddAttendee = () => {
    if (!newAttName.trim() || !newAttEmail.trim()) return;
    setAttendees((prev) => [
      ...prev,
      {
        id: `att-${Date.now()}`,
        name: newAttName.trim(),
        email: newAttEmail.trim(),
        company: 'External Guest',
        status: 'pending',
      },
    ]);
    setNewAttName('');
    setNewAttEmail('');
  };

  const handleRemoveAttendee = (id: string) => {
    setAttendees((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyId) return;
    if (scope === 'client' && !clientId) return;

    const startIso = `${date}T${startTime}:00`;
    const endIso = `${date}T${endTime}:00`;

    addMeeting(
      {
        companyId,
        clientId: scope === 'client' ? clientId : clientId || '',
        scope,
        departmentId: departmentId || undefined,
        serviceScope: serviceScope.trim() || undefined,
        engagementType,
        cadence: engagementType === 'one_time' ? 'one_time' : cadence,
        title: title.trim(),
        description:
          description.trim() ||
          `${scope === 'department' ? 'Department' : scope === 'company' ? 'Company' : 'Client'} ${
            engagementType === 'one_time' ? 'One-Time Deal' : formatCadenceLabel(cadence)
          } session${serviceScope ? ` — ${serviceScope}` : ''}.`,
        startTime: startIso,
        endTime: endIso,
        location: location.trim(),
        meetingType,
        status: 'scheduled',
        autoRescheduleEnabled,
        attendees,
        notes: {
          preMeeting: {
            agenda:
              agenda.trim() ||
              '1. Progress & deliverable review\n2. Action items & next milestone signoff',
            objectives: ['Confirm commitments and assign post-meeting tasks'],
            talkingPoints: '',
            preReadLinks: [],
            sentToAttendees: false,
            syncedToAccount: false,
          },
          postMeeting: {
            summary: '',
            keyDecisions: [],
            actionItems: [],
            followUpCommitment: '',
            sentToAttendees: false,
            syncedToAccount: false,
          },
        },
      },
      repeatOccurrences
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Schedule Master Calendar Meeting
              </h3>
              <p className="text-xs text-neutral-400">
                Client (One-Time / Recurring), Company-wide, or Department cadence scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-200">
          {/* Meeting Scope Switcher */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">Meeting Level / Scope</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'client', label: 'Client Meeting', icon: Users, sub: 'Company-wise client session' },
                { id: 'company', label: 'Company Meeting', icon: Building2, sub: 'Internal company-wide' },
                { id: 'department', label: 'Department Meeting', icon: Layers, sub: 'Specific department sync' },
              ] as const).map((item) => {
                const Icon = item.icon;
                const active = scope === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScope(item.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500 text-neutral-100 ring-1 ring-indigo-500/30'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      {item.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{item.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company & Department Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Company Profile *
              </label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  setDepartmentId('');
                }}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Department {scope === 'department' ? '*' : '(Optional)'}
              </label>
              <select
                value={departmentId}
                required={scope === 'department' && (selectedCompany?.departments?.length || 0) > 0}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">Company-wide / General</option>
                {(selectedCompany?.departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatCadenceLabel(d.meetingCadence)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Selector + Multi-Company Service Context */}
          {scope === 'client' && (
            <div className="space-y-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1 flex items-center justify-between">
                    <span>Client Account ({availableClients.length} in company)</span>
                    <button
                      type="button"
                      onClick={() => setIsAddClientOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Client
                    </button>
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    {availableClients.length === 0 ? (
                      <option value="">No clients in this company — click + Add Client</option>
                    ) : (
                      availableClients.map((cl) => (
                        <option key={cl.id} value={cl.id}>
                          {cl.name} (Tier {cl.tier})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    Service Engagement for {selectedCompany?.name}
                  </label>
                  <input
                    type="text"
                    value={serviceScope}
                    onChange={(e) => setServiceScope(e.target.value)}
                    placeholder="e.g. Financial Planning / Property Management"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Multi-Company Switcher Helper when client belongs to 2+ companies */}
              {selectedClientLinks.length > 1 && (
                <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
                  <div className="text-[11px] text-indigo-300 font-medium">
                    Multi-Company Client Context: {selectedClient?.name} is connected to{' '}
                    {selectedClientLinks.length} companies. Switch engagement:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClientLinks.map((lnk) => {
                      const comp = companies.find((c) => c.id === lnk.companyId);
                      const isCurrent = lnk.companyId === companyId;
                      return (
                        <button
                          key={lnk.companyId}
                          type="button"
                          onClick={() => {
                            setCompanyId(lnk.companyId);
                            setServiceScope(lnk.serviceScope);
                            setEngagementType(lnk.engagementType);
                            setCadence(lnk.cadence);
                            if (lnk.departmentId) setDepartmentId(lnk.departmentId);
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-indigo-600/25 border-indigo-500 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: comp?.accentHex || '#6366F1' }}
                          />
                          <span className="font-semibold">{comp?.name}</span>
                          <span className="text-neutral-400">· {lnk.serviceScope}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* One-Time Deal vs Recurring + Cadence Frequency */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Deal / Schedule Nature
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEngagementType('one_time');
                      setCadence('one_time');
                      setRepeatOccurrences(1);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer ${
                      engagementType === 'one_time'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    One-Time Deal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEngagementType('recurring');
                      if (cadence === 'one_time') setCadence('monthly');
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer ${
                      engagementType === 'recurring'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Repeat className="w-3 h-3" />
                    Recurring
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Frequency Cadence
                </label>
                <select
                  value={engagementType === 'one_time' ? 'one_time' : cadence}
                  disabled={engagementType === 'one_time'}
                  onChange={(e) => setCadence(e.target.value as CadenceFrequency)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500 disabled:opacity-60"
                >
                  {engagementType === 'one_time' ? (
                    <option value="one_time">One-Time Fixed Session</option>
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
                <label className="block text-neutral-300 font-medium mb-1">
                  Generate Occurrences
                </label>
                <select
                  value={repeatOccurrences}
                  disabled={engagementType === 'one_time'}
                  onChange={(e) => setRepeatOccurrences(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono disabled:opacity-60"
                >
                  <option value={1}>1 session (Single)</option>
                  <option value={2}>2 recurring sessions</option>
                  <option value={3}>3 recurring sessions</option>
                  <option value={4}>4 recurring sessions</option>
                  <option value={6}>6 recurring sessions</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoRescheduleEnabled}
                onChange={(e) => setAutoRescheduleEnabled(e.target.checked)}
                className="accent-indigo-500"
              />
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              Auto-reschedule to next appropriate date &amp; time if scheduled meeting does not happen
            </label>
          </div>

          {/* Meeting Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-neutral-300 font-medium mb-1">Meeting Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kaustubh · K & K Financial Planning"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Session Category</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Monthly Update">Monthly Update</option>
                <option value="Quarterly Review">Quarterly Review</option>
                <option value="Executive Follow-up">Executive Follow-up</option>
                <option value="Strategy Alignment">Strategy Alignment</option>
                <option value="Operational Check-in">Operational Check-in</option>
                <option value="Annual Health Check">Annual Health Check</option>
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              Location or Video Conference URL
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Google Meet · meet.google.com/xyz or Boardroom A"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Initial Agenda & Talking Points (Pre-Meeting Draft)
            </label>
            <textarea
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="1. Progress review&#10;2. Work delegation & next milestone signoff"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Attendees List */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                Attendees ({attendees.length})
              </span>
              <span className="text-neutral-400 text-[11px]">
                Pre-briefing & post-meeting work dispatch recipients
              </span>
            </label>

            <div className="space-y-1.5 mb-2">
              {attendees.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-medium text-neutral-200">{att.name}</span>
                    <span className="text-neutral-500 ml-2">({att.email})</span>
                    <span className="text-neutral-400 ml-2 text-[11px]">· {att.company}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(att.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAttName}
                onChange={(e) => setNewAttName(e.target.value)}
                placeholder="Guest / staff name..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
              />
              <input
                type="email"
                value={newAttEmail}
                onChange={(e) => setNewAttEmail(e.target.value)}
                placeholder="guest@example.com"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddAttendee}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {repeatOccurrences > 1
                ? `Schedule ${repeatOccurrences} Recurring Sessions`
                : 'Schedule & Sync Master Calendar'}
            </button>
          </div>
        </form>
      </div>

      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        defaultCompanyId={companyId}
        onClientCreated={(created) => {
          setCompanyId(created.companyId);
          setClientId(created.id);
        }}
      />
    </div>
  );
};
