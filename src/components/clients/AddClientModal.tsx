import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientTier } from '../../types';
import { X, Users, Building2, Calendar, Mail, Phone, DollarSign, FileText } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
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
  onClientCreated,
}) => {
  const { companies, selectedCompanyId, addClient } = useApp();

  const resolveInitialCompany = () => {
    if (defaultCompanyId && defaultCompanyId !== 'ALL') return defaultCompanyId;
    if (selectedCompanyId !== 'ALL') return selectedCompanyId;
    return companies[0]?.id || '';
  };

  const [companyId, setCompanyId] = useState<string>(resolveInitialCompany);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<ClientTier>('A');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [annualContractValue, setAnnualContractValue] = useState('250000');
  const [monthlyUpdateDeadline, setMonthlyUpdateDeadline] = useState(() => getOffsetDateIso(30));
  const [quarterlyReviewDeadline, setQuarterlyReviewDeadline] = useState(() => getOffsetDateIso(90));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCompanyId(resolveInitialCompany());
      setMonthlyUpdateDeadline(getOffsetDateIso(30));
      setQuarterlyReviewDeadline(getOffsetDateIso(90));
    }
  }, [isOpen, defaultCompanyId, selectedCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyId) return;

    const created = addClient({
      companyId,
      name: name.trim(),
      tier,
      industry: industry.trim() || 'Enterprise Services',
      contact: {
        name: contactName.trim() || name.trim(),
        title: contactTitle.trim() || 'Primary Stakeholder',
        email: contactEmail.trim() || `contact@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        phone: contactPhone.trim() || '+91 98000 00000',
      },
      monthlyUpdateDeadline,
      lastMonthlyUpdateSent: null,
      quarterlyReviewDeadline,
      lastQuarterlyReviewHeld: null,
      healthScore: tier === 'A' ? 92 : tier === 'B' ? 88 : 85,
      annualContractValue: Math.max(0, Number(annualContractValue) || 0),
      notes: notes.trim() || `Category ${tier} client onboarded to isolated company profile.`,
    });

    setName('');
    setIndustry('');
    setContactName('');
    setContactTitle('');
    setContactEmail('');
    setContactPhone('');
    setAnnualContractValue('250000');
    setNotes('');
    setTier('A');

    if (onClientCreated) {
      onClientCreated(created);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Add New Client Account</h3>
              <p className="text-xs text-neutral-400">
                Assign client to a company partition with engagement tier & review cadence
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
          {/* Company & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Company Profile *
              </label>
              <select
                required
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
              <label className="block text-neutral-300 font-medium mb-1">Client Tier Category *</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ClientTier)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 font-mono focus:outline-hidden focus:border-indigo-500"
              >
                <option value="A">Tier A - Top Priority (Monthly + QBR)</option>
                <option value="B">Tier B - Core Growth (Bi-Monthly)</option>
                <option value="C">Tier C - Standard SLA (Quarterly)</option>
              </select>
            </div>
          </div>

          {/* Client Name & Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Client / Account Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deshmukh Precision Engineering"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-200 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Industry / Domain</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Wealth Advisory, Manufacturing"
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
                  placeholder="e.g. Vikram Deshmukh"
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
                  placeholder="e.g. vikram@deshmukh.in"
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
              Create Client Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
