import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Client,
  ClientTier,
  ClientCompanyLink,
  CadenceFrequency,
  DealEngagementType,
} from '../../types';
import {
  X,
  Users,
  Building2,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  FileText,
  MapPin,
  Plus,
  Trash2,
  Briefcase,
  Repeat,
  Zap,
} from 'lucide-react';
import {
  CADENCE_OPTIONS,
  RECURRING_CADENCE_OPTIONS,
  getClientCompanyLinks,
} from '../../utils/calendarUtils';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
  editingClient?: Client | null;
  onClientCreated?: (client: Client) => void;
}

const getOffsetDateIso = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  defaultCompanyId,
  editingClient,
  onClientCreated,
}) => {
  const { companies, selectedCompanyId, addClient, updateClient } = useApp();

  const resolveInitialCompany = () => {
    if (defaultCompanyId && defaultCompanyId !== 'ALL') return defaultCompanyId;
    if (selectedCompanyId !== 'ALL') return selectedCompanyId;
    return companies[0]?.id || '';
  };

  const [companyLinks, setCompanyLinks] = useState<ClientCompanyLink[]>([]);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<ClientTier>('A');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [annualContractValue, setAnnualContractValue] = useState('250000');
  const [monthlyUpdateDeadline, setMonthlyUpdateDeadline] = useState(() => getOffsetDateIso(30));
  const [quarterlyReviewDeadline, setQuarterlyReviewDeadline] = useState(() => getOffsetDateIso(90));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (editingClient) {
      setCompanyLinks(getClientCompanyLinks(editingClient));
      setName(editingClient.name);
      setTier(editingClient.tier);
      setIndustry(editingClient.industry);
      setAddress(editingClient.address || '');
      setContactName(editingClient.contact.name);
      setContactTitle(editingClient.contact.title);
      setContactEmail(editingClient.contact.email);
      setContactPhone(editingClient.contact.phone);
      setAnnualContractValue(String(editingClient.annualContractValue || 0));
      setMonthlyUpdateDeadline(editingClient.monthlyUpdateDeadline);
      setQuarterlyReviewDeadline(editingClient.quarterlyReviewDeadline);
      setNotes(editingClient.notes);
    } else {
      const resolvedCompId = resolveInitialCompany();
      const matchedComp = companies.find((c) => c.id === resolvedCompId);
      setCompanyLinks([
        {
          companyId: resolvedCompId,
          serviceScope: '',
          engagementType: 'recurring',
          cadence: 'monthly',
          departmentId: matchedComp?.departments?.[0]?.id || '',
          status: 'active',
        },
      ]);
      setName('');
      setTier(matchedComp?.tier || 'A');
      setIndustry('');
      setAddress('');
      setContactName('');
      setContactTitle('');
      setContactEmail('');
      setContactPhone('');
      setAnnualContractValue('250000');
      setMonthlyUpdateDeadline(getOffsetDateIso(30));
      setQuarterlyReviewDeadline(getOffsetDateIso(90));
      setNotes('');
    }
  }, [isOpen, editingClient, defaultCompanyId, selectedCompanyId, companies]);

  if (!isOpen) return null;

  const handleAddCompanyLink = () => {
    const usedIds = new Set(companyLinks.map((l) => l.companyId));
    const nextComp = companies.find((c) => !usedIds.has(c.id)) || companies[0];
    if (!nextComp) return;
    setCompanyLinks((prev) => [
      ...prev,
      {
        companyId: nextComp.id,
        serviceScope: '',
        engagementType: 'recurring',
        cadence: 'monthly',
        departmentId: nextComp.departments?.[0]?.id || '',
        status: 'active',
      },
    ]);
  };

  const handleUpdateLink = (index: number, updates: Partial<ClientCompanyLink>) => {
    setCompanyLinks((prev) =>
      prev.map((link, idx) => {
        if (idx !== index) return link;
        const merged = { ...link, ...updates };
        if (updates.engagementType === 'one_time') {
          merged.cadence = 'one_time';
        } else if (updates.engagementType === 'recurring' && merged.cadence === 'one_time') {
          merged.cadence = 'monthly';
        }
        return merged;
      })
    );
  };

  const handleRemoveLink = (index: number) => {
    if (companyLinks.length <= 1) return;
    setCompanyLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || companyLinks.length === 0) return;

    const normalizedLinks: ClientCompanyLink[] = companyLinks.map((l) => ({
      ...l,
      serviceScope: l.serviceScope.trim() || industry.trim() || 'Primary Advisory Service',
    }));

    const primaryLink = normalizedLinks[0];
    const payload = {
      companyId: primaryLink.companyId,
      companyLinks: normalizedLinks,
      name: name.trim(),
      tier,
      industry:
        industry.trim() ||
        normalizedLinks.map((l) => l.serviceScope).filter(Boolean).join(', ') ||
        'Enterprise Services',
      address: address.trim() || undefined,
      engagementType: primaryLink.engagementType,
      cadence: primaryLink.cadence,
      contact: {
        name: contactName.trim() || name.trim(),
        title: contactTitle.trim() || 'Primary Stakeholder',
        email: contactEmail.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        phone: contactPhone.trim() || '+91 98000 00000',
      },
      monthlyUpdateDeadline,
      quarterlyReviewDeadline,
      annualContractValue: Math.max(0, Number(annualContractValue) || 0),
      notes:
        notes.trim() ||
        `Category ${tier} client linked across ${normalizedLinks.length} company profile(s).`,
    };

    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      const created = addClient({
        ...payload,
        lastMonthlyUpdateSent: null,
        lastQuarterlyReviewHeld: null,
        healthScore: tier === 'A' ? 92 : tier === 'B' ? 88 : 85,
      });
      if (onClientCreated) {
        onClientCreated(created);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                {editingClient ? `Modify Client: ${editingClient.name}` : 'Add New Client Account'}
              </h3>
              <p className="text-xs text-neutral-400">
                Connect client to 1 or multiple companies with service scope & One-Time / Recurring deal terms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-200">
          {/* Client Name, Tier & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-neutral-300 font-medium mb-1">Client / Account Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kaustubh / Deshmukh Holdings"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Client Tier Category *</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ClientTier)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              >
                <option value="A">Tier A - Priority</option>
                <option value="B">Tier B - Core Growth</option>
                <option value="C">Tier C - Standard</option>
              </select>
            </div>
          </div>

          {/* Multi-Company Connections Section */}
          <div className="bg-neutral-950/80 border border-indigo-500/25 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Connected Company Profiles & Service Engagements ({companyLinks.length})
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Link a client to 2–3+ companies (e.g., K & K for Financial Planning, Upside Matrics, Full Circle for Property Management)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCompanyLink}
                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Connect Another Company
              </button>
            </div>

            <div className="space-y-2.5">
              {companyLinks.map((link, idx) => {
                const matchedComp = companies.find((c) => c.id === link.companyId);
                const depts = matchedComp?.departments || [];
                return (
                  <div
                    key={idx}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                        Company Link #{idx + 1} {idx === 0 ? '(Primary)' : ''}
                      </span>
                      {companyLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Company *</label>
                        <select
                          value={link.companyId}
                          onChange={(e) => {
                            const newComp = companies.find((c) => c.id === e.target.value);
                            handleUpdateLink(idx, {
                              companyId: e.target.value,
                              departmentId: newComp?.departments?.[0]?.id || '',
                            });
                          }}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.tier ? `(Tier ${c.tier})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-indigo-400" />
                          Service Scope / Purpose *
                        </label>
                        <input
                          type="text"
                          required
                          value={link.serviceScope}
                          onChange={(e) => handleUpdateLink(idx, { serviceScope: e.target.value })}
                          placeholder="e.g. Financial Planning / Property Management"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Deal Type</label>
                        <select
                          value={link.engagementType}
                          onChange={(e) =>
                            handleUpdateLink(idx, {
                              engagementType: e.target.value as DealEngagementType,
                            })
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="recurring">Recurring Engagement</option>
                          <option value="one_time">One-Time Deal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Meeting Cadence</label>
                        <select
                          value={link.cadence}
                          disabled={link.engagementType === 'one_time'}
                          onChange={(e) =>
                            handleUpdateLink(idx, { cadence: e.target.value as CadenceFrequency })
                          }
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500 disabled:opacity-60"
                        >
                          {link.engagementType === 'one_time' ? (
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
                        <label className="block text-[11px] text-neutral-400 mb-1">Department (Optional)</label>
                        <select
                          value={link.departmentId || ''}
                          onChange={(e) => handleUpdateLink(idx, { departmentId: e.target.value })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="">Company-wide</option>
                          {depts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Industry & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Industry / Domain Summary</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Wealth Advisory, Real Estate"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Client Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 18, Navi Mumbai / Pune"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Primary Contact Info */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3.5 space-y-3">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Primary Contact Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Kaustubh / Vikram Deshmukh"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Title / Designation</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  placeholder="e.g. Managing Director"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-400" />
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. contact@client.in"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-400" />
                  Phone Number
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98200 00000"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cadence Deadlines & ACV */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" />
                Monthly Update Due
              </label>
              <input
                type="date"
                required
                value={monthlyUpdateDeadline}
                onChange={(e) => setMonthlyUpdateDeadline(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" />
                Quarterly Review Due
              </label>
              <input
                type="date"
                required
                value={quarterlyReviewDeadline}
                onChange={(e) => setQuarterlyReviewDeadline(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-400" />
                Annual Value (ACV)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={annualContractValue}
                onChange={(e) => setAnnualContractValue(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-neutral-400" />
              Engagement Notes / SLA Requirements
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key deliverables, preferred meeting cadence, compliance requirements..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              {editingClient ? 'Save Client Changes' : 'Create Client Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
