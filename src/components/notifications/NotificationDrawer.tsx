import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  FileCheck2,
  Calendar,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatDateLabel, formatTimeRange } from '../../utils/calendarUtils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMeeting?: (meetingId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenMeeting,
}) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    triggerManualTestAlert,
    runDeadlineScan,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'deadlines' | 'meetings'>('all');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'deadlines') return n.type === 'tier_a_deadline';
    if (activeTab === 'meetings') return n.type === 'meeting_advance' || n.type === 'meeting_imminent';
    return true;
  });

  const getSeverityIcon = (type: string, severity: string) => {
    if (type === 'tier_a_deadline') {
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (type === 'meeting_advance') {
      return <Calendar className="w-4 h-4 text-sky-400 shrink-0" />;
    }
    if (type === 'meeting_imminent') {
      return <Clock className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
    return <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Notifications & Reminders</h2>
              <p className="text-xs text-neutral-400">
                24h advance notices · 15m alerts · Tier A deadlines
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

        {/* Quick test triggers bar */}
        <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 text-xs">
          <div className="text-neutral-400 font-medium mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Automated Alert Simulators
            </span>
            <button
              onClick={() => runDeadlineScan()}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Scan Deadlines
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => triggerManualTestAlert('24h_advance')}
              className="flex-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded text-neutral-200 text-[11px] truncate transition-colors text-center cursor-pointer"
            >
              Test 24h Notice
            </button>
            <button
              onClick={() => triggerManualTestAlert('pre_start')}
              className="flex-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded text-neutral-200 text-[11px] truncate transition-colors text-center cursor-pointer"
            >
              Test 15m Alert
            </button>
            <button
              onClick={() => triggerManualTestAlert('tier_a_deadline')}
              className="flex-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded text-amber-300 text-[11px] truncate transition-colors text-center cursor-pointer"
            >
              Tier A Deadline
            </button>
          </div>
        </div>

        {/* Tabs and bulk actions */}
        <div className="px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-1 p-0.5 bg-neutral-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-neutral-700 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'deadlines'
                  ? 'bg-neutral-700 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Deadlines
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'meetings'
                  ? 'bg-neutral-700 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Meetings
            </button>
          </div>

          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60">
          {filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 text-xs px-6">
              <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
              <p className="font-medium text-neutral-300">No active alerts</p>
              <p className="mt-1 text-neutral-500">
                You will be notified 24 hours prior to scheduled meetings, before start, and when Tier A deadlines approach.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors ${
                  notif.read ? 'bg-neutral-900/40 opacity-75' : 'bg-neutral-850/90'
                } hover:bg-neutral-800/50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getSeverityIcon(notif.type, notif.severity)}</div>
                    <div>
                      <h4
                        className={`text-xs font-semibold ${
                          notif.severity === 'urgent'
                            ? 'text-rose-300'
                            : notif.severity === 'warning'
                            ? 'text-amber-300'
                            : 'text-neutral-200'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-500 font-mono tabular-nums">
                        <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{new Date(notif.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notif.read && (
                      <button
                        onClick={() => markNotificationRead(notif.id)}
                        title="Mark as read"
                        className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50 rounded"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => clearNotification(notif.id)}
                      title="Dismiss"
                      className="p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {notif.meetingId && onOpenMeeting && (
                  <div className="mt-3 pl-6">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenMeeting(notif.meetingId!);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open Meeting Notes & Actions →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Automated triggers running in background</span>
          <span className="font-mono tabular-nums text-neutral-400">Time: 2026-10-03</span>
        </div>
      </div>
    </div>
  );
};
