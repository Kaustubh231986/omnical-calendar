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
  Calendar,
  Award,
  FileText,
  TrendingUp,
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
    currentCompany,
  } = useApp();

  const navLinks = [
    {
      id: 'calendar',
      label: 'Schedule',
      mobileLabel: 'Schedule',
      icon: Calendar,
      tooltip: 'Master Unified Calendar',
    },
    {
      id: 'tiers',
      label: 'Client Tiers',
      mobileLabel: 'Tiers',
      icon: Award,
      tooltip: 'Client Tiers & Cadence',
      badge: tierAUpcomingDeadlinesCount,
    },
    {
      id: 'logs',
      label: 'Meeting Logs',
      mobileLabel: 'Logs',
      icon: FileText,
      tooltip: 'Historical Logs & Attendance',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      mobileLabel: 'Analytics',
      icon: TrendingUp,
      tooltip: 'Engagement & Compliance Analytics',
    },
    {
      id: 'profiles',
      label: 'Companies',
      mobileLabel: 'Companies',
      icon: Building2,
      tooltip: 'Company Profiles & Isolation',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 max-w-7xl mx-auto gap-2">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0">
            Ω
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap">
              OmniCal
            </span>
            {currentCompany ? (
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: currentCompany.accentHex }}
                />
                <span className="truncate max-w-[110px] sm:max-w-none">{currentCompany.name}</span>
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                Multi-Tenant Master
              </span>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Fits cleanly starting at md: 768px, zero horizontal scrolling) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
          {navLinks.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.tooltip}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Video Guide button */}
          <button
            onClick={onOpenVideoGuide}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Video Guide & Deployment Tutorial"
          >
            <Play className="w-3.5 h-3.5 fill-current text-rose-400 shrink-0" />
            <span className="hidden xl:inline">Video Guide</span>
          </button>

          {/* Email Gateways Multi-Account Manager */}
          <button
            onClick={onOpenEmailGateway}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Configure Dedicated Sender Email IDs for Each Company"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden xl:inline">Email Gateways</span>
          </button>

          {/* Sync Feeds */}
          <button
            onClick={() => syncAllCalendars()}
            disabled={isSyncing}
            title="Sync all company calendar feeds"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-100 border border-neutral-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden xl:inline">{isSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Meeting notifications & deadline alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-mono font-semibold rounded-full flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* + New Meeting */}
          <button
            onClick={onOpenNewMeeting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Meeting</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar: Fixed 5-column grid that 100% fits within any viewport without horizontal scroll! */}
      <div className="md:hidden border-t border-neutral-800 bg-neutral-950/95 px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 text-center">
          {navLinks.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer relative ${
                  isActive
                    ? 'bg-neutral-850 text-indigo-400 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-amber-500 text-black text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-tight truncate w-full">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
