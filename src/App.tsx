/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { CalendarView } from './components/calendar/CalendarView';
import { ClientTierManagement } from './components/clients/ClientTierManagement';
import { HistoricalLogsView } from './components/logs/HistoricalLogsView';
import { EngagementAnalytics } from './components/analytics/EngagementAnalytics';
import { CompanyProfilesView } from './components/companies/CompanyProfilesView';
import { MeetingDetailModal } from './components/calendar/MeetingDetailModal';
import { NewMeetingModal } from './components/calendar/NewMeetingModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { VideoWalkthroughModal } from './components/video/VideoWalkthroughModal';
import { EmailGatewaySettingsModal } from './components/email/EmailGatewaySettingsModal';
import { ShieldCheck, Building2, Bell, AlertTriangle } from 'lucide-react';

function DashboardContent() {
  const {
    currentCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    tierAUpcomingDeadlinesCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [newMeetingInitialDate, setNewMeetingInitialDate] = useState<string | undefined>(undefined);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVideoGuideOpen, setIsVideoGuideOpen] = useState(false);
  const [isEmailGatewayOpen, setIsEmailGatewayOpen] = useState(false);
  const [emailGatewayCompanyId, setEmailGatewayCompanyId] = useState<string | undefined>(undefined);

  const handleOpenNewMeeting = (date?: string) => {
    setNewMeetingInitialDate(date);
    setIsNewMeetingOpen(true);
  };

  const handleOpenEmailConfig = (companyId?: string) => {
    setEmailGatewayCompanyId(companyId);
    setIsEmailGatewayOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200">
      {/* Top Bar Header */}
      <Header
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewMeeting={() => handleOpenNewMeeting()}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenVideoGuide={() => setIsVideoGuideOpen(true)}
        onOpenEmailGateway={() => handleOpenEmailConfig()}
      />

      {/* Contextual Tenant Strip: Shown when viewing an isolated company profile or when Tier A has deadlines */}
      {currentCompany ? (
        <div className="bg-indigo-950/30 border-b border-indigo-500/20 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentCompany.accentHex }}
              />
              <span className="font-semibold text-neutral-200">
                Isolated Tenant Partition: {currentCompany.name}
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">
                ({currentCompany.encryptionPartition})
              </span>
            </div>
            <button
              onClick={() => setSelectedCompanyId('ALL')}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
            >
              Exit to Unified Master Schedule →
            </button>
          </div>
        </div>
      ) : (
        tierAUpcomingDeadlinesCount > 0 && (
          <div className="bg-amber-950/20 border-b border-amber-500/20 px-6 py-1.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {tierAUpcomingDeadlinesCount} Category A mandatory compliance deadlines require attention this week.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('tiers')}
                className="text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
              >
                Review Cadence & Reminders →
              </button>
            </div>
          </div>
        )
      )}

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'calendar' && (
          <CalendarView
            onOpenMeeting={(id) => setSelectedMeetingId(id)}
            onOpenNewMeeting={(date) => handleOpenNewMeeting(date)}
          />
        )}

        {activeTab === 'tiers' && (
          <ClientTierManagement
            onScheduleMeetingForClient={(clientId, companyId) => {
              setSelectedCompanyId(companyId);
              handleOpenNewMeeting();
            }}
          />
        )}

        {activeTab === 'logs' && (
          <HistoricalLogsView onOpenMeeting={(id) => setSelectedMeetingId(id)} />
        )}

        {activeTab === 'analytics' && <EngagementAnalytics />}

        {activeTab === 'profiles' && (
          <CompanyProfilesView onConfigureEmail={(cId) => handleOpenEmailConfig(cId)} />
        )}
      </main>

      {/* Quiet Corporate Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-400">OmniCal Enterprise Engine</span>
            <span>·</span>
            <span>Multi-Company Partitioned Architecture</span>
            <span>·</span>
            <span className="font-mono tabular-nums">TLS 1.3 / RFC 5545</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500">
            <button
              onClick={() => setIsVideoGuideOpen(true)}
              className="text-neutral-400 hover:text-neutral-200 underline cursor-pointer"
            >
              Deployment & Video Guide
            </button>
            <span>·</span>
            <span className="text-neutral-600">Virtual Clock: 2026-09-05 (GMT+05:30 IST)</span>
          </div>
        </div>
      </footer>

      {/* Meeting Detail Modal */}
      <MeetingDetailModal
        meetingId={selectedMeetingId}
        onClose={() => setSelectedMeetingId(null)}
      />

      {/* New Meeting Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingOpen}
        onClose={() => setIsNewMeetingOpen(false)}
        initialDate={newMeetingInitialDate}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenMeeting={(id) => setSelectedMeetingId(id)}
      />

      {/* Video Walkthrough Modal */}
      <VideoWalkthroughModal
        isOpen={isVideoGuideOpen}
        onClose={() => setIsVideoGuideOpen(false)}
        onOpenEmailGateway={() => {
          setIsVideoGuideOpen(false);
          handleOpenEmailConfig();
        }}
      />

      {/* Multi-Email Gateway Configuration Modal */}
      <EmailGatewaySettingsModal
        isOpen={isEmailGatewayOpen}
        onClose={() => setIsEmailGatewayOpen(false)}
        defaultCompanyId={emailGatewayCompanyId}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
