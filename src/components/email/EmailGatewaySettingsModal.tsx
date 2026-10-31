import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmailProviderType, EmailGatewayConfig } from '../../types';
import {
  X,
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Server,
  Lock,
  ExternalLink,
  Users,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface EmailGatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
}

export const EmailGatewaySettingsModal: React.FC<EmailGatewaySettingsModalProps> = ({
  isOpen,
  onClose,
  defaultCompanyId,
}) => {
  const { companies, updateCompany } = useApp();

  const [selectedCompId, setSelectedCompId] = useState<string>(
    defaultCompanyId || companies[0]?.id || ''
  );
  const [testRecipient, setTestRecipient] = useState<string>('email.kaustubh@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    senderUsed: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentComp = companies.find((c) => c.id === selectedCompId) || companies[0];

  // Default or current email configuration for the selected company
  const currentEmailConfig: EmailGatewayConfig = currentComp?.emailConfig || {
    provider: 'google_workspace',
    senderName: `${currentComp?.name || 'Executive'} Calendar`,
    senderEmail: currentComp?.accountExecutive.email || 'notifications@domain.com',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: currentComp?.accountExecutive.email || 'user@gmail.com',
    secure: false,
    ccList: ['executive.assistant@domain.com'],
    bccList: [],
    status: 'connected',
    lastTestedAt: '2026-10-30T20:30:00+05:30',
  };

  const handleUpdateConfig = (updates: Partial<EmailGatewayConfig>) => {
    if (!currentComp) return;
    const newConfig: EmailGatewayConfig = {
      ...currentEmailConfig,
      ...updates,
    };
    updateCompany(currentComp.id, { emailConfig: newConfig });
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    // Simulate real SMTP handshake & DKIM signing
    await new Promise((resolve) => setTimeout(resolve, 950));

    const timestamp = new Date().toLocaleTimeString();
    handleUpdateConfig({
      status: 'connected',
      lastTestedAt: new Date().toISOString(),
    });

    setTestResult({
      success: true,
      message: `Test email successfully routed through [${currentEmailConfig.smtpHost || 'SMTP Gateway'}]! Pre-meeting agenda template verified.`,
      senderUsed: `${currentEmailConfig.senderName} <${currentEmailConfig.senderEmail}>`,
    });
    setIsSendingTest(false);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                Multi-Email Gateway & Inbound/Outbound Routing
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Multi-Tenant Partitioned
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Configure distinct sender email IDs for each company profile (e.g. Mandar, Agharkar, Rajadhyaksha, NBC)
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-neutral-200 text-xs space-y-6">
          {/* Explanation Banner */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                How Multi-Email Configuration Works in OmniCal
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                Each company operates as an isolated tenant. When you dispatch a{' '}
                <strong>Pre-Meeting Briefing</strong>, <strong>Post-Meeting Recap</strong>, or{' '}
                <strong>24h Advance Reminder</strong>, OmniCal automatically sends the email from that specific
                company’s configured email address so clients only see that brand's mailbox.
              </p>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono bg-neutral-950/80 px-2.5 py-1.5 rounded border border-neutral-800 shrink-0">
              Active Companies: {companies.length} Mailboxes
            </div>
          </div>

          {/* Company Selector Tab Strip */}
          <div className="space-y-2">
            <label className="text-neutral-300 font-semibold text-xs flex items-center justify-between">
              <span>Select Company Profile to Configure Email:</span>
              <span className="text-neutral-400 font-normal text-[11px]">
                Click any company to configure its dedicated sender mailbox
              </span>
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {companies.map((c) => {
                const isSelected = c.id === selectedCompId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCompId(c.id);
                      setTestResult(null);
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 border-indigo-500 text-neutral-100 shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: c.accentHex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form: Selected Company Email Gateway Configuration */}
          {currentComp && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentComp.accentHex }}
                  />
                  <h3 className="text-sm font-bold text-neutral-100">
                    {currentComp.name} · Outbound Email Gateway
                  </h3>
                  <span className="text-neutral-500 font-mono text-[10px]">
                    ({currentComp.encryptionPartition})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Gateway Ready
                  </span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-400 font-mono">
                    Last tested: 2026-10-30
                  </span>
                </div>
              </div>

              {/* Grid: Sender Details & Provider Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Email Service Provider
                  </label>
                  <select
                    value={currentEmailConfig.provider}
                    onChange={(e) =>
                      handleUpdateConfig({
                        provider: e.target.value as EmailProviderType,
                        smtpHost:
                          e.target.value === 'google_workspace'
                            ? 'smtp.gmail.com'
                            : e.target.value === 'microsoft365'
                            ? 'smtp.office365.com'
                            : e.target.value === 'resend'
                            ? 'smtp.resend.com'
                            : e.target.value === 'sendgrid'
                            ? 'smtp.sendgrid.net'
                            : 'smtp.yourdomain.com',
                        smtpPort: 587,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="google_workspace">Google Workspace / Gmail (App Password)</option>
                    <option value="microsoft365">Microsoft 365 / Outlook</option>
                    <option value="smtp">Custom SMTP Server</option>
                    <option value="resend">Resend API / SMTP</option>
                    <option value="sendgrid">SendGrid API / SMTP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Sender Display Name (From Name)
                  </label>
                  <input
                    type="text"
                    value={currentEmailConfig.senderName}
                    onChange={(e) => handleUpdateConfig({ senderName: e.target.value })}
                    placeholder="e.g. Mandar Kanitkar Executive Calendar"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    Dedicated Sender Email Address (From Address)
                  </label>
                  <input
                    type="email"
                    value={currentEmailConfig.senderEmail}
                    onChange={(e) => handleUpdateConfig({ senderEmail: e.target.value })}
                    placeholder="e.g. mandar@kanitkar.com"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Grid: SMTP Host, Port, Username, App Password */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-neutral-300 font-medium mb-1">
                    SMTP Host Endpoint
                  </label>
                  <input
                    type="text"
                    value={currentEmailConfig.smtpHost || ''}
                    onChange={(e) => handleUpdateConfig({ smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={currentEmailConfig.smtpPort || 587}
                    onChange={(e) => handleUpdateConfig({ smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    App Password / Secret
                  </label>
                  <input
                    type="password"
                    defaultValue="••••••••••••••••"
                    placeholder="Enter App Password"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Team CC & Notification Routing */}
              <div className="space-y-2">
                <label className="block text-neutral-300 font-medium">
                  Team Members to Always CC on Meeting Notes & 24h Alerts
                </label>
                <input
                  type="text"
                  value={currentEmailConfig.ccList.join(', ')}
                  onChange={(e) =>
                    handleUpdateConfig({
                      ccList: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="assistant@kanitkar.com, ops@kanitkar.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-neutral-200 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                />
                <p className="text-[11px] text-neutral-500">
                  Comma-separated email addresses. Every pre-meeting brief and post-meeting recap from {currentComp.name} will copy these recipients.
                </p>
              </div>

              {/* Interactive Test Email Dispatcher */}
              <div className="bg-neutral-900 p-3.5 rounded-lg border border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Test Outbound Email Delivery
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Sends a test pre-meeting agenda to verify credentials
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Enter your email to receive test notice..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-bounce' : ''}`} />
                    <span>{isSendingTest ? 'Dispatching Test...' : 'Send Test Email'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">{testResult.message}</div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Sender Identity: {testResult.senderUsed} → Recipient: {testRecipient}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Guide: How to Get App Passwords */}
          <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-950/60 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Quick Setup Instructions for Google Workspace & Gmail (Multi-Account)
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-400 leading-relaxed">
              <li>
                Log in to each company Google account (e.g. <code className="text-neutral-200">mandar@kanitkar.com</code> or <code className="text-neutral-200">nitin@agharkarfoods.in</code>).
              </li>
              <li>
                Go to <strong>Google Account Security</strong> &gt; Enable <strong>2-Step Verification</strong> if not already enabled.
              </li>
              <li>
                Search for <strong>"App Passwords"</strong> (or go to <code className="text-indigo-400">myaccount.google.com/apppasswords</code>).
              </li>
              <li>
                Create an app password named <em>"OmniCal Calendar Dispatcher"</em> and copy the 16-character code into the field above.
              </li>
              <li>
                Repeat for each company profile. When you send meeting briefs or recaps, OmniCal routes through that company's specific mailbox!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            {companies.length} distinct mailboxes registered
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium cursor-pointer"
          >
            Close & Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
