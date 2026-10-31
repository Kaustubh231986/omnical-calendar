import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MeetingType, Attendee } from '../../types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { companies, clients, addMeeting, selectedCompanyId } = useApp();

  const defaultCompId = selectedCompanyId !== 'ALL' ? selectedCompanyId : companies[0]?.id || '';
  const [companyId, setCompanyId] = useState(defaultCompId);

  // Filter clients by selected company
  const availableClients = clients.filter((c) => c.companyId === companyId);
  const [clientId, setClientId] = useState(availableClients[0]?.id || '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Monthly Update');
  const [date, setDate] = useState(initialDate || '2026-09-06');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('Google Meet · meet.google.com/omni-cadence');
  const [agenda, setAgenda] = useState('');

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttName, setNewAttName] = useState('');
  const [newAttEmail, setNewAttEmail] = useState('');

  // Update client selection when company changes
  useEffect(() => {
    const clientsForCompany = clients.filter((c) => c.companyId === companyId);
    if (clientsForCompany.length > 0) {
      setClientId(clientsForCompany[0].id);
    } else {
      setClientId('');
    }
  }, [companyId, clients]);

  // Set default attendees when client/company changes
  useEffect(() => {
    const comp = companies.find((c) => c.id === companyId);
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
    if (client) {
      initialList.push({
        id: `att-cli-${Date.now() + 1}`,
        name: client.contact.name,
        email: client.contact.email,
        company: client.name,
        status: 'pending',
      });
      setTitle(`${client.name} · ${meetingType}`);
    }
    setAttendees(initialList);
  }, [companyId, clientId, companies, clients, meetingType]);

  if (!isOpen) return null;

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
    if (!title.trim() || !companyId || !clientId) return;

    const startIso = `${date}T${startTime}:00-07:00`;
    const endIso = `${date}T${endTime}:00-07:00`;

    addMeeting({
      companyId,
      clientId,
      title: title.trim(),
      description: description.trim(),
      startTime: startIso,
      endTime: endIso,
      location: location.trim(),
      meetingType,
      status: 'scheduled',
      attendees,
      notes: {
        preMeeting: {
          agenda: agenda.trim() || '1. Performance review\n2. Key deliverables and roadmap signoff',
          objectives: ['Review quarterly milestones', 'Align on SLA commitments'],
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
    });

    onClose();
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Schedule Master Calendar Event</h3>
              <p className="text-xs text-neutral-400">
                Isolated company partition with automatic 24-hr advance reminder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-200">
          {/* Company & Client selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Company Profile (Data Partition)
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
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
              <label className="block text-neutral-300 font-medium mb-1 flex items-center justify-between">
                <span>Client Account</span>
                {selectedClient && (
                  <span className="font-mono text-[11px] text-indigo-400 font-semibold">
                    Tier {selectedClient.tier} Client
                  </span>
                )}
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                {availableClients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} (Tier {cl.tier})
                  </option>
                ))}
              </select>
            </div>
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
                placeholder="e.g. Nexus Cloud · Executive Monthly Cadence"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Cadence / Type</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Quarterly Review">Quarterly Review (Tier A)</option>
                <option value="Monthly Update">Monthly Update (Mandatory)</option>
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

          {/* Description & Agenda */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Initial Agenda & Talking Points (Pre-Meeting Draft)
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="1. Monthly SLA uptime review&#10;2. Q4 strategic roadmap alignment&#10;3. Compliance signoff"
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
                Will receive pre-meeting briefing and post-meeting recap
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
                    className="text-neutral-500 hover:text-rose-400 p-1"
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
                placeholder="Guest name..."
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
              Schedule & Sync Master Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
