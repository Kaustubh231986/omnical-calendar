import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  RefreshCw,
  Plus,
  ShieldCheck,
  Building2,
  Play,
  Mail,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewMeeting: () => void;
  onOpenNotifications: () => void;
  onOpenVideoGuide: () => void;
  onOpenEmailGateway: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewMeeting,
  onOpenNotifications,
  onOpenVideoGuide,
  onOpenEmailGateway,
}) => {
  const {
    isSyncing,
    syncAllCalendars,
    unreadNotificationsCount,
    tierAUpcomingDeadlinesCount,
    selectedCompanyId,
    currentCompany,
  } = useApp();

  const navLinks = [
    { id: 'calendar', label: 'Master Schedule' },
    { id: 'tiers', label: 'Client Tiers & Cadence' },
    { id: 'logs', label: 'Historical Logs & Attendance' },
    { id: 'analytics', label: 'Engagement Analytics' },
    { id: 'profiles', label: 'Company Profiles' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
            Ω
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap">
            OmniCal Enterprise
          </span>
          {currentCompany ? (
            <span className="text-xs text-neutral-400 border-l border-neutral-700/80 pl-3 hidden sm:inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCompany.accentHex }} />
              {currentCompany.name} (Isolated)
            </span>
          ) : (
            <span className="text-xs text-neutral-400 border-l border-neutral-700/80 pl-3 hidden sm:inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Unified Multi-Tenant Mode
            </span>
          )}
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-300">
          {navLinks.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`transition-colors relative py-1 text-xs md:text-sm whitespace-nowrap ${
                  isActive
                    ? 'text-neutral-100 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {item.label}
                {item.id === 'tiers' && tierAUpcomingDeadlinesCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-mono bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    {tierAUpcomingDeadlinesCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          {/* Video Guide with animated play badge */}
          <button
            onClick={onOpenVideoGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            title="Watch Video Tutorial: Machine Deployment & Multi-Email Configuration"
          >
            <Play className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span className="hidden sm:inline">Video Guide & Deploy</span>
            <span className="sm:hidden">Video</span>
          </button>

          {/* Email Gateways Multi-Account Manager */}
          <button
            onClick={onOpenEmailGateway}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            title="Configure Multiple Email IDs for Company Profiles"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>Email Gateways</span>
          </button>

          <button
            onClick={() => syncAllCalendars()}
            disabled={isSyncing}
            title="Sync all company calendar feeds"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isSyncing ? 'Reconciling...' : 'Sync Feeds'}</span>
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Notifications & Meeting Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-mono font-semibold rounded-full flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenNewMeeting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-neutral-800/80 gap-3 text-xs bg-neutral-900/60 no-scrollbar">
        {navLinks.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded transition-colors ${
              currentTab === item.id
                ? 'bg-neutral-800 text-neutral-100 font-medium'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={onOpenEmailGateway}
          className="whitespace-nowrap px-2.5 py-1 rounded text-neutral-300 hover:text-neutral-100 bg-neutral-800/80 border border-neutral-700 flex items-center gap-1"
        >
          <Mail className="w-3 h-3 text-indigo-400" />
          Email Gateways
        </button>
      </div>
    </header>
  );
};
