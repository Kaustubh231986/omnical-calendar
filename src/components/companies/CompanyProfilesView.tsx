import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import {
  Building2,
  Lock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Plus,
  ExternalLink,
  Users,
  Calendar,
  Settings2,
  X,
  Mail,
} from 'lucide-react';
import { formatDateLabel } from '../../utils/calendarUtils';

interface CompanyProfilesViewProps {
  onConfigureEmail?: (companyId: string) => void;
}

export const CompanyProfilesView: React.FC<CompanyProfilesViewProps> = ({ onConfigureEmail }) => {
  const {
    companies,
    clients,
    meetings,
    selectedCompanyId,
    setSelectedCompanyId,
    addCompany,
    updateCompany,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/New_York (EDT)');
  const [newExecutiveName, setNewExecutiveName] = useState('');
  const [newExecutiveEmail, setNewExecutiveEmail] = useState('');

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const slug = newCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const partition = `ENC-PART-${slug.slice(0, 4).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    addCompany({
      name: newCompanyName.trim(),
      slug,
      brandColor: 'indigo',
      accentHex: '#6366F1',
      timezone: newTimezone,
      calendarFeedUrl: `https://cal.${slug}.internal/feed.ics`,
      encryptionPartition: partition,
      accountExecutive: {
        name: newExecutiveName.trim() || 'Managing Partner',
        email: newExecutiveEmail.trim() || `lead@${slug}.com`,
        role: 'Account Director',
      },
      syncSettings: {
        syncPreMeetingBriefs: true,
        syncPostMeetingRecaps: true,
        reminderHoursAhead: 24,
      },
    });

    setNewCompanyName('');
    setNewExecutiveName('');
    setNewExecutiveEmail('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100">
              Multi-Company Isolated Profiles & Data Partitions
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Each company profile operates as a cryptographically separated tenant with independent
            calendars, clients, pre/post-meeting notes, and account sync targets.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Company Profile
        </button>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((comp) => {
          const compClients = clients.filter((c) => c.companyId === comp.id);
          const compMeetings = meetings.filter((m) => m.companyId === comp.id);
          const isSelected = selectedCompanyId === comp.id;

          return (
            <div
              key={comp.id}
              className={`bg-neutral-900 border rounded-xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header with color indicator */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-neutral-800 shrink-0"
                      style={{ backgroundColor: comp.accentHex }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100">{comp.name}</h3>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {comp.timezone}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Isolated
                  </span>
                </div>

                {/* Security Partition & Key */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 space-y-1 font-mono text-[11px]">
                  <div className="text-neutral-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    Security Partition:
                  </div>
                  <div className="text-neutral-300 truncate">{comp.encryptionPartition}</div>
                </div>

                {/* Calendar Feed Source */}
                <div className="space-y-1 text-xs">
                  <span className="text-neutral-400 text-[11px]">Remote Calendar Feed</span>
                  <div className="text-neutral-300 font-mono text-[11px] truncate bg-neutral-950 px-2.5 py-1.5 rounded border border-neutral-800">
                    {comp.calendarFeedUrl}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <div className="text-[11px] text-neutral-400">Clients Managed</div>
                    <div className="text-sm font-bold font-mono text-neutral-100 mt-0.5">
                      {compClients.length} accounts
                    </div>
                  </div>
                  <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                    <div className="text-[11px] text-neutral-400">Scheduled Sessions</div>
                    <div className="text-sm font-bold font-mono text-neutral-100 mt-0.5">
                      {compMeetings.length} sessions
                    </div>
                  </div>
                </div>

                {/* Outbound Email Gateway info */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      Dedicated Outbound Email:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  </div>
                  <div className="text-neutral-200 font-mono text-[11px] truncate">
                    {comp.emailConfig?.senderEmail || comp.accountExecutive.email}
                  </div>
                </div>

                {/* Account Executive */}
                <div className="text-xs text-neutral-400 pt-1">
                  <div className="text-[11px] text-neutral-500">Lead Account Director:</div>
                  <div className="text-neutral-200 font-medium mt-0.5">
                    {comp.accountExecutive.name} ({comp.accountExecutive.email})
                  </div>
                </div>
              </div>

              {/* Card Footer: Switch into this isolated profile & Configure Email */}
              <div className="pt-3 border-t border-neutral-800 flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedCompanyId(isSelected ? 'ALL' : comp.id)
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                  }`}
                >
                  {isSelected ? 'Exit Isolated View' : `Isolate Calendar`}
                </button>

                {onConfigureEmail && (
                  <button
                    onClick={() => onConfigureEmail(comp.id)}
                    className="p-2 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                    title={`Configure ${comp.name} Outbound Email Gateway`}
                  >
                    <Mail className="w-4 h-4 text-indigo-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Company Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-5 space-y-4 text-xs text-neutral-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Add New Company Profile
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Cobalt Horizon Aerospace"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Timezone</label>
                <select
                  value={newTimezone}
                  onChange={(e) => setNewTimezone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden"
                >
                  <option value="America/New_York (EDT)">America/New_York (EDT)</option>
                  <option value="America/Chicago (CDT)">America/Chicago (CDT)</option>
                  <option value="America/Los_Angeles (PDT)">America/Los_Angeles (PDT)</option>
                  <option value="Europe/London (BST)">Europe/London (BST)</option>
                  <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Lead Account Executive Name
                </label>
                <input
                  type="text"
                  required
                  value={newExecutiveName}
                  onChange={(e) => setNewExecutiveName(e.target.value)}
                  placeholder="e.g. Richard Sterling"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Executive Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newExecutiveEmail}
                  onChange={(e) => setNewExecutiveEmail(e.target.value)}
                  placeholder="e.g. r.sterling@cobalthorizon.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Create Isolated Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
