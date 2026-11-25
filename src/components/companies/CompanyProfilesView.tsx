import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CompanyProfile,
  ClientTier,
  CadenceFrequency,
  Client,
  Department,
  WorkAssignee,
  MeetingScope,
} from '../../types';
import {
  Building2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Users,
  Calendar,
  X,
  Mail,
  Pencil,
  Trash2,
  Layers,
  Briefcase,
  UserCheck,
  Repeat,
  Zap,
  MapPin,
} from 'lucide-react';
import {
  RECURRING_CADENCE_OPTIONS,
  formatCadenceLabel,
  getClientLinkForCompany,
} from '../../utils/calendarUtils';
import { AddClientModal } from '../clients/AddClientModal';

interface CompanyProfilesViewProps {
  onConfigureEmail?: (companyId: string) => void;
  onScheduleMeeting?: (opts: {
    companyId?: string;
    clientId?: string;
    departmentId?: string;
    scope?: MeetingScope;
  }) => void;
}

export const CompanyProfilesView: React.FC<CompanyProfilesViewProps> = ({
  onConfigureEmail,
  onScheduleMeeting,
}) => {
  const {
    companies,
    meetings,
    selectedCompanyId,
    setSelectedCompanyId,
    addCompany,
    updateCompany,
    deleteCompany,
    getClientsForCompany,
    deleteClient,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addWorkAssignee,
    updateWorkAssignee,
    deleteWorkAssignee,
  } = useApp();

  // Add New Company Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyTier, setNewCompanyTier] = useState<ClientTier>('A');
  const [newCompanyCadence, setNewCompanyCadence] = useState<CadenceFrequency>('monthly');
  const [newTimezone, setNewTimezone] = useState('GMT+05:30 (India Standard Time)');
  const [newExecutiveName, setNewExecutiveName] = useState('');
  const [newExecutiveEmail, setNewExecutiveEmail] = useState('');

  // Client Add/Edit Modal state
  const [addClientCompanyId, setAddClientCompanyId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Company Client Database Modal state
  const [databaseCompanyId, setDatabaseCompanyId] = useState<string | null>(null);

  // Manage / Edit Company, Departments & Assignees Modal state
  const [manageCompanyId, setManageCompanyId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<'details' | 'departments' | 'staff'>('departments');

  // Inline department editor state
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    headName: '',
    headEmail: '',
    meetingCadence: 'weekly' as CadenceFrequency,
    preferredTime: '11:00',
    description: '',
  });

  // Inline work assignee editor state
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    role: '',
    departmentId: '',
    defaultCc: true,
  });

  // Inline company edit form state
  const [companyEditForm, setCompanyEditForm] = useState<{
    name: string;
    tier: ClientTier;
    timezone: string;
    meetingCadence: CadenceFrequency;
    autoRescheduleMissed: boolean;
    execName: string;
    execEmail: string;
    execRole: string;
  } | null>(null);

  const openManageCompany = (comp: CompanyProfile, initialTab: 'details' | 'departments' | 'staff') => {
    setManageCompanyId(comp.id);
    setManageTab(initialTab);
    setEditingDeptId(null);
    setDeptForm({
      name: '',
      headName: '',
      headEmail: '',
      meetingCadence: 'weekly',
      preferredTime: '11:00',
      description: '',
    });
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      email: '',
      role: '',
      departmentId: comp.departments?.[0]?.id || '',
      defaultCc: true,
    });
    setCompanyEditForm({
      name: comp.name,
      tier: comp.tier || 'A',
      timezone: comp.timezone,
      meetingCadence: comp.meetingCadence || 'monthly',
      autoRescheduleMissed: comp.autoRescheduleMissed ?? true,
      execName: comp.accountExecutive.name,
      execEmail: comp.accountExecutive.email,
      execRole: comp.accountExecutive.role,
    });
  };

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
      tier: newCompanyTier,
      meetingCadence: newCompanyCadence,
      autoRescheduleMissed: true,
      brandColor: 'indigo',
      accentHex: '#6366F1',
      timezone: newTimezone,
      calendarFeedUrl: `https://cal.${slug}.internal/feed.ics`,
      encryptionPartition: partition,
      departments: [],
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
    setNewCompanyTier('A');
    setNewCompanyCadence('monthly');
    setNewExecutiveName('');
    setNewExecutiveEmail('');
    setIsAddModalOpen(false);
  };

  const managedCompany = companies.find((c) => c.id === manageCompanyId) || null;
  const databaseCompany = companies.find((c) => c.id === databaseCompanyId) || null;

  const handleSaveCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedCompany || !companyEditForm || !companyEditForm.name.trim()) return;
    updateCompany(managedCompany.id, {
      name: companyEditForm.name.trim(),
      tier: companyEditForm.tier,
      timezone: companyEditForm.timezone,
      meetingCadence: companyEditForm.meetingCadence,
      autoRescheduleMissed: companyEditForm.autoRescheduleMissed,
      accountExecutive: {
        name: companyEditForm.execName.trim() || 'Managing Partner',
        email: companyEditForm.execEmail.trim(),
        role: companyEditForm.execRole.trim() || 'Account Director',
      },
    });
    setManageCompanyId(null);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedCompany || !deptForm.name.trim()) return;
    if (editingDeptId) {
      updateDepartment(managedCompany.id, editingDeptId, {
        name: deptForm.name.trim(),
        headName: deptForm.headName.trim() || managedCompany.accountExecutive.name,
        headEmail: deptForm.headEmail.trim() || managedCompany.accountExecutive.email,
        meetingCadence: deptForm.meetingCadence,
        preferredTime: deptForm.preferredTime,
        description: deptForm.description.trim(),
      });
    } else {
      addDepartment(managedCompany.id, {
        name: deptForm.name.trim(),
        headName: deptForm.headName.trim() || managedCompany.accountExecutive.name,
        headEmail: deptForm.headEmail.trim() || managedCompany.accountExecutive.email,
        meetingCadence: deptForm.meetingCadence,
        preferredTime: deptForm.preferredTime,
        description: deptForm.description.trim(),
      });
    }
    setEditingDeptId(null);
    setDeptForm({
      name: '',
      headName: '',
      headEmail: '',
      meetingCadence: 'weekly',
      preferredTime: '11:00',
      description: '',
    });
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedCompany || !staffForm.name.trim() || !staffForm.email.trim()) return;
    if (editingStaffId) {
      updateWorkAssignee(managedCompany.id, editingStaffId, {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        role: staffForm.role.trim() || 'Operations Associate',
        departmentId: staffForm.departmentId || undefined,
        defaultCc: staffForm.defaultCc,
      });
    } else {
      addWorkAssignee(managedCompany.id, {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        role: staffForm.role.trim() || 'Operations Associate',
        departmentId: staffForm.departmentId || undefined,
        defaultCc: staffForm.defaultCc,
      });
    }
    setEditingStaffId(null);
    setStaffForm({
      name: '',
      email: '',
      role: '',
      departmentId: managedCompany.departments?.[0]?.id || '',
      defaultCc: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100">
              Multi-Company Profiles, Departments & Client Databases
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Manage companies, company & department meeting cadences (Weekly, Monthly, Quarterly, Half-Yearly, Yearly),
            company client databases (supporting clients across multiple companies), and company-wise work assignees for post-meeting CC/forwarding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setAddClientCompanyId(
                selectedCompanyId !== 'ALL' ? selectedCompanyId : companies[0]?.id || ''
              )
            }
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            Add Client
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Company Profile
          </button>
        </div>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map((comp) => {
          const compClients = getClientsForCompany(comp.id);
          const compMeetings = meetings.filter((m) => m.companyId === comp.id);
          const deptCount = comp.departments?.length || 0;
          const staffCount = comp.workAssignees?.length || 0;
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
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-neutral-800 shrink-0"
                      style={{ backgroundColor: comp.accentHex }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-neutral-100 truncate">{comp.name}</h3>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        {comp.timezone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={comp.tier || 'A'}
                      onChange={(e) =>
                        updateCompany(comp.id, { tier: e.target.value as ClientTier })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer focus:outline-hidden ${
                        (comp.tier || 'A') === 'A'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : comp.tier === 'B'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                      title="Company engagement tier"
                    >
                      <option value="A" className="bg-neutral-900 text-neutral-200">Tier A</option>
                      <option value="B" className="bg-neutral-900 text-neutral-200">Tier B</option>
                      <option value="C" className="bg-neutral-900 text-neutral-200">Tier C</option>
                    </select>

                    <button
                      onClick={() => openManageCompany(comp, 'details')}
                      className="p-1 text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 rounded cursor-pointer"
                      title="Modify company details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete "${comp.name}" profile? Existing meetings remain unless removed separately.`
                          )
                        ) {
                          deleteCompany(comp.id);
                        }
                      }}
                      className="p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded cursor-pointer"
                      title="Delete company profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cadence & Departments Summary */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    Company: {formatCadenceLabel(comp.meetingCadence || 'monthly')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-sky-400" />
                    {deptCount} Dept{deptCount === 1 ? '' : 's'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    {staffCount} Staff CC
                  </span>
                </div>

                {/* Departments quick list */}
                {comp.departments && comp.departments.length > 0 && (
                  <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                      <span>Departments & Cadences</span>
                      <button
                        onClick={() => openManageCompany(comp, 'departments')}
                        className="text-indigo-400 hover:text-indigo-300 font-sans normal-case cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1">
                      {comp.departments.slice(0, 2).map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-200 truncate">{d.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-sky-300 shrink-0">
                            {formatCadenceLabel(d.meetingCadence)}
                          </span>
                        </div>
                      ))}
                      {comp.departments.length > 2 && (
                        <div className="text-[10px] text-neutral-500 font-mono">
                          +{comp.departments.length - 2} more department(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metrics: Clickable Client Database & Sessions */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDatabaseCompanyId(comp.id)}
                    className="bg-neutral-950 hover:bg-neutral-850 p-2.5 rounded-lg border border-neutral-800 hover:border-emerald-500/40 text-left transition-colors cursor-pointer group"
                    title="Open company client database"
                  >
                    <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>Client Database</span>
                      <Users className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-sm font-bold font-mono text-neutral-100 mt-0.5 group-hover:text-emerald-300">
                      {compClients.length} client{compClients.length === 1 ? '' : 's'}
                    </div>
                  </button>

                  <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                    <div className="text-[11px] text-neutral-400">Scheduled Sessions</div>
                    <div className="text-sm font-bold font-mono text-neutral-100 mt-0.5">
                      {compMeetings.length} session{compMeetings.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {/* Outbound Email & Account Executive */}
                <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-400" />
                      Mailbox & Lead:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  </div>
                  <div className="text-neutral-200 font-medium text-[11px] truncate">
                    {comp.accountExecutive.name} ·{' '}
                    <span className="font-mono text-neutral-400">
                      {comp.emailConfig?.senderEmail || comp.accountExecutive.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDatabaseCompanyId(comp.id)}
                    className="flex-1 py-2 px-2.5 rounded-lg text-xs font-medium bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Clients ({compClients.length})
                  </button>

                  <button
                    onClick={() => openManageCompany(comp, 'departments')}
                    className="flex-1 py-2 px-2.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Depts & Staff
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCompanyId(isSelected ? 'ALL' : comp.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    {isSelected ? 'Exit Isolated View' : 'Isolate Calendar'}
                  </button>

                  {onScheduleMeeting && (
                    <button
                      onClick={() =>
                        onScheduleMeeting({ companyId: comp.id, scope: 'company' })
                      }
                      className="px-2.5 py-1.5 text-indigo-300 hover:text-white bg-neutral-800 hover:bg-indigo-600 rounded-lg border border-neutral-700 transition-colors cursor-pointer text-xs font-medium flex items-center gap-1"
                      title={`Schedule company or department meeting for ${comp.name}`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Meet
                    </button>
                  )}

                  {onConfigureEmail && (
                    <button
                      onClick={() => onConfigureEmail(comp.id)}
                      className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                      title={`Configure ${comp.name} Outbound Email Gateway`}
                    >
                      <Mail className="w-4 h-4 text-indigo-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* COMPANY CLIENT DATABASE MODAL                                         */}
      {/* ===================================================================== */}
      {databaseCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: databaseCompany.accentHex }}
                />
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">
                    {databaseCompany.name} — Company Client Database
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Showing all clients connected to {databaseCompany.name} (including multi-company clients & their specific service scopes)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingClient(null);
                    setAddClientCompanyId(databaseCompany.id);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Client
                </button>
                <button
                  onClick={() => setDatabaseCompanyId(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs">
              {getClientsForCompany(databaseCompany.id).length === 0 ? (
                <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                  <Users className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                  <p className="font-semibold text-neutral-300">
                    No clients linked to {databaseCompany.name} yet
                  </p>
                  <p className="mt-1">Click "+ Add Client" to add or connect a client here.</p>
                </div>
              ) : (
                getClientsForCompany(databaseCompany.id).map((cli) => {
                  const link = getClientLinkForCompany(cli, databaseCompany.id);
                  const allLinks = cli.companyLinks || [];
                  const dept = databaseCompany.departments?.find((d) => d.id === link?.departmentId);

                  return (
                    <div
                      key={cli.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-700 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-neutral-100">{cli.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Tier {cli.tier}
                          </span>
                          {link?.engagementType === 'one_time' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              One-Time Deal
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" />
                              Recurring · {formatCadenceLabel(link?.cadence || 'monthly')}
                            </span>
                          )}
                        </div>

                        <div className="text-indigo-300 font-medium flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>
                            Service under {databaseCompany.name}:{' '}
                            <strong className="text-neutral-100">
                              {link?.serviceScope || cli.industry}
                            </strong>
                          </span>
                          {dept && (
                            <span className="text-neutral-400 font-mono text-[11px]">
                              · Dept: {dept.name}
                            </span>
                          )}
                        </div>

                        {allLinks.length > 1 && (
                          <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-1.5">
                            <span className="text-neutral-500">Also connected to:</span>
                            {allLinks
                              .filter((l) => l.companyId !== databaseCompany.id)
                              .map((otherLink) => {
                                const otherComp = companies.find((c) => c.id === otherLink.companyId);
                                return (
                                  <span
                                    key={otherLink.companyId}
                                    className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300"
                                  >
                                    {otherComp?.name || otherLink.companyId} ({otherLink.serviceScope})
                                  </span>
                                );
                              })}
                          </div>
                        )}

                        <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-3">
                          <span>
                            {cli.contact.name} ({cli.contact.email})
                          </span>
                          {cli.address && (
                            <span className="flex items-center gap-1 text-neutral-400">
                              <MapPin className="w-3 h-3 text-neutral-500" />
                              {cli.address}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onScheduleMeeting && (
                          <button
                            onClick={() => {
                              setDatabaseCompanyId(null);
                              onScheduleMeeting({
                                companyId: databaseCompany.id,
                                clientId: cli.id,
                                departmentId: link?.departmentId,
                                scope: 'client',
                              });
                            }}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Schedule
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingClient(cli);
                            setAddClientCompanyId(databaseCompany.id);
                          }}
                          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 cursor-pointer"
                          title="Edit client"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete client "${cli.name}" from the system?`)) {
                              deleteClient(cli.id);
                            }
                          }}
                          className="p-1.5 bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 rounded-lg border border-neutral-700 cursor-pointer"
                          title="Delete client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MANAGE COMPANY, DEPARTMENTS & WORK ASSIGNEES MODAL                    */}
      {/* ===================================================================== */}
      {managedCompany && companyEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: managedCompany.accentHex }}
                />
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">
                    Manage {managedCompany.name} — Info, Departments & Work Staff
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Add, modify, or delete company details, department meeting schedules, and staff CC recipients
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManageCompanyId(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center px-5 border-b border-neutral-800 bg-neutral-950/50 text-xs">
              <button
                onClick={() => setManageTab('departments')}
                className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  manageTab === 'departments'
                    ? 'border-indigo-500 text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Departments ({managedCompany.departments?.length || 0})
              </button>
              <button
                onClick={() => setManageTab('staff')}
                className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  manageTab === 'staff'
                    ? 'border-indigo-500 text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Assigned Work & CC Staff ({managedCompany.workAssignees?.length || 0})
              </button>
              <button
                onClick={() => setManageTab('details')}
                className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  manageTab === 'details'
                    ? 'border-indigo-500 text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Modify Company Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs text-neutral-200 space-y-5">
              {/* TAB: DEPARTMENTS */}
              {manageTab === 'departments' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {(managedCompany.departments || []).length === 0 ? (
                      <div className="p-6 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                        No departments added yet for {managedCompany.name}. Add one below to schedule weekly, monthly, quarterly, half-yearly, or yearly department meetings.
                      </div>
                    ) : (
                      (managedCompany.departments || []).map((dept) => (
                        <div
                          key={dept.id}
                          className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-100 text-sm">{dept.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                {formatCadenceLabel(dept.meetingCadence)}
                              </span>
                              {dept.preferredTime && (
                                <span className="text-[11px] font-mono text-neutral-400">
                                  @{dept.preferredTime}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400">
                              Head: {dept.headName} ({dept.headEmail})
                              {dept.description ? ` · ${dept.description}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onScheduleMeeting && (
                              <button
                                onClick={() => {
                                  setManageCompanyId(null);
                                  onScheduleMeeting({
                                    companyId: managedCompany.id,
                                    departmentId: dept.id,
                                    scope: 'department',
                                  });
                                }}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Calendar className="w-3 h-3" />
                                Schedule Dept
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingDeptId(dept.id);
                                setDeptForm({
                                  name: dept.name,
                                  headName: dept.headName,
                                  headEmail: dept.headEmail,
                                  meetingCadence: dept.meetingCadence,
                                  preferredTime: dept.preferredTime || '11:00',
                                  description: dept.description || '',
                                });
                              }}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 cursor-pointer"
                              title="Edit department"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDepartment(managedCompany.id, dept.id)}
                              className="p-1.5 bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 rounded-lg border border-neutral-700 cursor-pointer"
                              title="Delete department"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add / Edit Department Form */}
                  <form
                    onSubmit={handleSaveDepartment}
                    className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="font-semibold text-neutral-200">
                      {editingDeptId ? 'Modify Department' : 'Add New Department'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        required
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                        placeholder="Department name (e.g. Financial Planning)"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                      <select
                        value={deptForm.meetingCadence}
                        onChange={(e) =>
                          setDeptForm({
                            ...deptForm,
                            meetingCadence: e.target.value as CadenceFrequency,
                          })
                        }
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        {RECURRING_CADENCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={deptForm.preferredTime}
                        onChange={(e) =>
                          setDeptForm({ ...deptForm, preferredTime: e.target.value })
                        }
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={deptForm.headName}
                        onChange={(e) => setDeptForm({ ...deptForm, headName: e.target.value })}
                        placeholder="Department head name"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                      <input
                        type="email"
                        value={deptForm.headEmail}
                        onChange={(e) => setDeptForm({ ...deptForm, headEmail: e.target.value })}
                        placeholder="Head email"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                      <input
                        type="text"
                        value={deptForm.description}
                        onChange={(e) =>
                          setDeptForm({ ...deptForm, description: e.target.value })
                        }
                        placeholder="Purpose / scope note"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {editingDeptId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDeptId(null);
                            setDeptForm({
                              name: '',
                              headName: '',
                              headEmail: '',
                              meetingCadence: 'weekly',
                              preferredTime: '11:00',
                              description: '',
                            });
                          }}
                          className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {editingDeptId ? 'Update Department' : 'Add Department'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: WORK ASSIGNEES / CC STAFF */}
              {manageTab === 'staff' && (
                <div className="space-y-4">
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3 text-[11px] text-neutral-300">
                    Configure team members & work assignees specific to <strong>{managedCompany.name}</strong>. After any client meeting finishes, you can CC or forward action items directly to these company-wise team members.
                  </div>

                  <div className="space-y-2">
                    {(managedCompany.workAssignees || []).map((staff) => (
                      <div
                        key={staff.id}
                        className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-100">{staff.name}</span>
                            <span className="text-[11px] text-neutral-400">· {staff.role}</span>
                            {staff.defaultCc && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Default CC
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                            {staff.email}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStaffId(staff.id);
                              setStaffForm({
                                name: staff.name,
                                email: staff.email,
                                role: staff.role,
                                departmentId: staff.departmentId || '',
                                defaultCc: Boolean(staff.defaultCc),
                              });
                            }}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteWorkAssignee(managedCompany.id, staff.id)}
                            className="p-1.5 bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 rounded-lg border border-neutral-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleSaveStaff}
                    className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="font-semibold text-neutral-200">
                      {editingStaffId ? 'Modify Staff Assignee' : 'Add Work Assignee / CC Recipient'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        placeholder="Staff / Assignee Name"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                      <input
                        type="email"
                        required
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder="staff@company.com"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono"
                      />
                      <input
                        type="text"
                        value={staffForm.role}
                        onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                        placeholder="Role (e.g. Tax Lead, Property Exec)"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      />
                      <select
                        value={staffForm.departmentId}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, departmentId: e.target.value })
                        }
                        className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200"
                      >
                        <option value="">All Departments</option>
                        {(managedCompany.departments || []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffForm.defaultCc}
                          onChange={(e) =>
                            setStaffForm({ ...staffForm, defaultCc: e.target.checked })
                          }
                          className="accent-indigo-500"
                        />
                        Auto-select for CC on post-meeting client emails
                      </label>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {editingStaffId ? 'Update Assignee' : 'Add Assignee'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: MODIFY COMPANY PROFILE */}
              {manageTab === 'details' && (
                <form onSubmit={handleSaveCompanyDetails} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Company Name</label>
                      <input
                        type="text"
                        required
                        value={companyEditForm.name}
                        onChange={(e) =>
                          setCompanyEditForm({ ...companyEditForm, name: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Company Tier</label>
                      <select
                        value={companyEditForm.tier}
                        onChange={(e) =>
                          setCompanyEditForm({
                            ...companyEditForm,
                            tier: e.target.value as ClientTier,
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 font-mono"
                      >
                        <option value="A">Tier A</option>
                        <option value="B">Tier B</option>
                        <option value="C">Tier C</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Company-Wide Meeting Cadence
                      </label>
                      <select
                        value={companyEditForm.meetingCadence}
                        onChange={(e) =>
                          setCompanyEditForm({
                            ...companyEditForm,
                            meetingCadence: e.target.value as CadenceFrequency,
                          })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                      >
                        {RECURRING_CADENCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Timezone</label>
                      <select
                        value={companyEditForm.timezone}
                        onChange={(e) =>
                          setCompanyEditForm({ ...companyEditForm, timezone: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                      >
                        <option value="GMT+05:30 (India Standard Time)">GMT+05:30 (India Standard Time)</option>
                        <option value="America/New_York (EDT)">America/New_York (EDT)</option>
                        <option value="America/Chicago (CDT)">America/Chicago (CDT)</option>
                        <option value="America/Los_Angeles (PDT)">America/Los_Angeles (PDT)</option>
                        <option value="Europe/London (BST)">Europe/London (BST)</option>
                        <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Lead Account Executive
                      </label>
                      <input
                        type="text"
                        required
                        value={companyEditForm.execName}
                        onChange={(e) =>
                          setCompanyEditForm({ ...companyEditForm, execName: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Executive Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={companyEditForm.execEmail}
                        onChange={(e) =>
                          setCompanyEditForm({ ...companyEditForm, execEmail: e.target.value })
                        }
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={companyEditForm.autoRescheduleMissed}
                      onChange={(e) =>
                        setCompanyEditForm({
                          ...companyEditForm,
                          autoRescheduleMissed: e.target.checked,
                        })
                      }
                      className="accent-indigo-500"
                    />
                    <span>
                      Auto-reschedule missed or unheld meetings for {managedCompany.name} to next valid cadence date/time
                    </span>
                  </label>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${managedCompany.name}" permanently?`)) {
                          deleteCompany(managedCompany.id);
                          setManageCompanyId(null);
                        }
                      }}
                      className="px-3 py-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Company
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManageCompanyId(null)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Save Company Changes
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADD COMPANY MODAL                                                     */}
      {/* ===================================================================== */}
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
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
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
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Company Tier Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { tier: 'A', title: 'Tier A', sub: 'Priority · Monthly + QBR' },
                    { tier: 'B', title: 'Tier B', sub: 'Growth · Bi-Monthly' },
                    { tier: 'C', title: 'Tier C', sub: 'Standard · Quarterly' },
                  ] as const).map((item) => {
                    const active = newCompanyTier === item.tier;
                    return (
                      <button
                        key={item.tier}
                        type="button"
                        onClick={() => setNewCompanyTier(item.tier)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500 text-neutral-100 ring-1 ring-indigo-500/40'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        <div className="font-mono font-bold text-xs">{item.title}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Company Meeting Cadence
                  </label>
                  <select
                    value={newCompanyCadence}
                    onChange={(e) => setNewCompanyCadence(e.target.value as CadenceFrequency)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden"
                  >
                    {RECURRING_CADENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Timezone</label>
                  <select
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 focus:outline-hidden"
                  >
                    <option value="GMT+05:30 (India Standard Time)">GMT+05:30 (IST)</option>
                    <option value="America/New_York (EDT)">New York (EDT)</option>
                    <option value="America/Chicago (CDT)">Chicago (CDT)</option>
                    <option value="America/Los_Angeles (PDT)">Los Angeles (PDT)</option>
                    <option value="Europe/London (BST)">London (BST)</option>
                    <option value="Asia/Tokyo (JST)">Tokyo (JST)</option>
                  </select>
                </div>
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
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs cursor-pointer"
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

      {/* Add / Edit Client Modal */}
      <AddClientModal
        isOpen={addClientCompanyId !== null || editingClient !== null}
        onClose={() => {
          setAddClientCompanyId(null);
          setEditingClient(null);
        }}
        defaultCompanyId={addClientCompanyId || undefined}
        editingClient={editingClient}
      />
    </div>
  );
};
