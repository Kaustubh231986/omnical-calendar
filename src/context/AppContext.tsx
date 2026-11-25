import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CompanyProfile,
  Client,
  MeetingEvent,
  AppNotification,
  ClientTier,
  AttendanceStatus,
  MeetingNotes,
  AccountSyncLog,
  Department,
  WorkAssignee,
  ForwardedMailRecord,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_CLIENTS,
  INITIAL_MEETINGS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  CURRENT_VIRTUAL_TIME,
  getDaysDifference,
  doesClientBelongToCompany,
  getClientCompanyLinks,
  computeNextRescheduleSlot,
  isMeetingOverdueUnheld,
  addCadenceToDate,
  formatLocalIsoWithOffset,
} from '../utils/calendarUtils';

interface ForwardMailPayload {
  toEmails: string[];
  ccEmails: string[];
  note: string;
  subject?: string;
}

interface RescheduleOptions {
  auto?: boolean;
  customStartTime?: string;
  customEndTime?: string;
  reason?: string;
}

interface AppContextType {
  companies: CompanyProfile[];
  clients: Client[];
  meetings: MeetingEvent[];
  notifications: AppNotification[];
  selectedCompanyId: string; // 'ALL' or company ID
  setSelectedCompanyId: (id: string) => void;
  selectedTier: ClientTier | 'ALL';
  setSelectedTier: (tier: ClientTier | 'ALL') => void;
  isSyncing: boolean;
  syncAllCalendars: () => Promise<void>;

  // Meeting actions
  addMeeting: (
    meetingData: Omit<MeetingEvent, 'id' | 'syncLogs' | 'notifications'>,
    repeatOccurrences?: number
  ) => MeetingEvent;
  updateMeeting: (id: string, updates: Partial<MeetingEvent>) => void;
  deleteMeeting: (id: string) => void;
  rescheduleMeeting: (meetingId: string, options?: RescheduleOptions) => void;
  markMeetingMissed: (meetingId: string, autoRescheduleNow?: boolean) => void;
  runAutoRescheduleScan: () => number;
  overdueOrMissedMeetings: MeetingEvent[];

  // Notes & Sync actions
  updatePreNotes: (meetingId: string, preNotes: Partial<MeetingNotes['preMeeting']>) => void;
  updatePostNotes: (meetingId: string, postNotes: Partial<MeetingNotes['postMeeting']>) => void;
  sendPreMeetingBriefing: (meetingId: string) => void;
  sendPostMeetingRecap: (meetingId: string) => void;
  forwardPostMeetingMail: (meetingId: string, payload: ForwardMailPayload) => void;
  syncNotesToAccount: (meetingId: string, target: 'pre' | 'post' | 'both') => void;

  // Attendance actions
  setAttendeeStatus: (meetingId: string, attendeeId: string, status: AttendanceStatus) => void;

  // Client & Tier actions
  addClient: (clientData: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientsForCompany: (companyId: string) => Client[];
  dispatchMonthlyUpdate: (clientId: string) => void;
  recordQuarterlyReview: (clientId: string) => void;
  runDeadlineScan: () => void;

  // Notifications actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  triggerManualTestAlert: (type: '24h_advance' | 'pre_start' | 'tier_a_deadline') => void;

  // Company, Department & Work Assignee actions
  addCompany: (comp: Omit<CompanyProfile, 'id' | 'syncStatus' | 'lastSyncedAt'>) => CompanyProfile;
  updateCompany: (id: string, updates: Partial<CompanyProfile>) => void;
  deleteCompany: (id: string) => void;
  addDepartment: (companyId: string, dept: Omit<Department, 'id'>) => Department;
  updateDepartment: (companyId: string, deptId: string, updates: Partial<Department>) => void;
  deleteDepartment: (companyId: string, deptId: string) => void;
  addWorkAssignee: (companyId: string, assignee: Omit<WorkAssignee, 'id'>) => WorkAssignee;
  updateWorkAssignee: (companyId: string, assigneeId: string, updates: Partial<WorkAssignee>) => void;
  deleteWorkAssignee: (companyId: string, assigneeId: string) => void;

  // Multi-calendar visibility controls
  visibleCalendarIds: string[];
  toggleCalendarVisibility: (companyId: string) => void;
  selectAllCalendars: () => void;
  deselectAllCalendars: () => void;

  // Derived views
  currentCompany: CompanyProfile | null;
  filteredMeetings: MeetingEvent[];
  filteredClients: Client[];
  tierAUpcomingDeadlinesCount: number;
  unreadNotificationsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANIES: 'omnical_companies_v3',
  CLIENTS: 'omnical_clients_v3',
  MEETINGS: 'omnical_meetings_v3',
  NOTIFICATIONS: 'omnical_notifications_v3',
  VISIBLE_CALS: 'omnical_visible_cals_v3',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [meetings, setMeetings] = useState<MeetingEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
    } catch {
      return INITIAL_MEETINGS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISIBLE_CALS);
      return saved ? JSON.parse(saved) : INITIAL_COMPANIES.map((c) => c.id);
    } catch {
      return INITIAL_COMPANIES.map((c) => c.id);
    }
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<ClientTier | 'ALL'>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_CALS, JSON.stringify(visibleCalendarIds));
    } catch (e) {
      console.error(e);
    }
  }, [visibleCalendarIds]);

  const toggleCalendarVisibility = useCallback((id: string) => {
    setVisibleCalendarIds((prev) =>
      prev.includes(id) ? prev.filter((calId) => calId !== id) : [...prev, id]
    );
  }, []);

  const selectAllCalendars = useCallback(() => {
    setVisibleCalendarIds(companies.map((c) => c.id));
  }, [companies]);

  const deselectAllCalendars = useCallback(() => {
    setVisibleCalendarIds([]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
    } catch (e) {
      console.error(e);
    }
  }, [companies]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
    } catch (e) {
      console.error(e);
    }
  }, [meetings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  const currentCompany = useMemo(() => {
    if (selectedCompanyId === 'ALL') return null;
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedCompanyId !== 'ALL') {
        if (m.companyId !== selectedCompanyId) return false;
      } else {
        if (!visibleCalendarIds.includes(m.companyId)) return false;
      }
      if (selectedTier !== 'ALL' && m.clientId) {
        const client = clients.find((c) => c.id === m.clientId);
        if (client && client.tier !== selectedTier) {
          return false;
        }
      }
      return true;
    });
  }, [meetings, clients, selectedCompanyId, selectedTier, visibleCalendarIds]);

  // Multi-company aware client filter
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (selectedCompanyId !== 'ALL') {
        if (!doesClientBelongToCompany(c, selectedCompanyId)) return false;
      } else {
        const links = getClientCompanyLinks(c);
        const anyVisible =
          visibleCalendarIds.includes(c.companyId) ||
          links.some((l) => visibleCalendarIds.includes(l.companyId));
        if (!anyVisible) return false;
      }
      if (selectedTier !== 'ALL' && c.tier !== selectedTier) {
        return false;
      }
      return true;
    });
  }, [clients, selectedCompanyId, selectedTier, visibleCalendarIds]);

  const getClientsForCompany = useCallback(
    (companyId: string) => {
      return clients.filter((c) => doesClientBelongToCompany(c, companyId));
    },
    [clients]
  );

  // Overdue unheld meetings (>= Oct 2026 to avoid mutating static Sept 5-8 demo snapshot) or explicitly marked 'missed'
  const overdueOrMissedMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      if (m.status === 'missed') return true;
      if (m.startTime >= '2026-10-01' && isMeetingOverdueUnheld(m, now)) {
        return true;
      }
      return false;
    });
  }, [meetings]);

  const tierAUpcomingDeadlinesCount = useMemo(() => {
    return clients
      .filter(
        (c) =>
          (selectedCompanyId === 'ALL' || doesClientBelongToCompany(c, selectedCompanyId)) &&
          c.tier === 'A'
      )
      .reduce((count, c) => {
        const daysMonthly = getDaysDifference(c.monthlyUpdateDeadline, CURRENT_VIRTUAL_TIME);
        const daysQuarterly = getDaysDifference(c.quarterlyReviewDeadline, CURRENT_VIRTUAL_TIME);
        let flags = 0;
        if (daysMonthly <= 7) flags++;
        if (daysQuarterly <= 14) flags++;
        return count + flags;
      }, 0);
  }, [clients, selectedCompanyId]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const syncAllCalendars = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const timestamp = new Date().toISOString();
    setCompanies((prev) =>
      prev.map((c) => ({
        ...c,
        syncStatus: 'synced',
        lastSyncedAt: timestamp,
      }))
    );

    const syncNotif: AppNotification = {
      id: `sync-${Date.now()}`,
      type: 'sync_complete',
      title: 'Unified Master Schedule Synchronized',
      message: `Verified and synchronized calendar endpoints for ${companies.length} distinct company profiles. All events up to date.`,
      timestamp,
      read: false,
      severity: 'info',
    };

    setNotifications((prev) => [syncNotif, ...prev]);
    setIsSyncing(false);
  }, [companies.length]);

  // Add meeting (supports optional recurring occurrences creation)
  const addMeeting = useCallback(
    (
      meetingData: Omit<MeetingEvent, 'id' | 'syncLogs' | 'notifications'>,
      repeatOccurrences = 1
    ) => {
      const baseTs = Date.now();
      const count =
        meetingData.engagementType === 'recurring' &&
        meetingData.cadence &&
        meetingData.cadence !== 'one_time'
          ? Math.max(1, Math.min(12, repeatOccurrences))
          : 1;

      const createdEvents: MeetingEvent[] = [];
      let cursorStart = new Date(meetingData.startTime);
      let cursorEnd = new Date(meetingData.endTime);

      for (let i = 0; i < count; i++) {
        const startIso = i === 0 ? meetingData.startTime : formatLocalIsoWithOffset(cursorStart);
        const endIso = i === 0 ? meetingData.endTime : formatLocalIsoWithOffset(cursorEnd);
        const newId = `meet-${baseTs}-${i}`;

        const ev: MeetingEvent = {
          ...meetingData,
          id: newId,
          startTime: startIso,
          endTime: endIso,
          autoRescheduleEnabled: meetingData.autoRescheduleEnabled ?? true,
          notifications: {
            dayBeforeSent: false,
            hourBeforeSent: false,
          },
          syncLogs: [
            {
              id: `log-${baseTs}-${i}`,
              timestamp: new Date().toISOString(),
              action: count > 1 ? `Recurring Series Created (${i + 1}/${count})` : 'Event Created & Scheduled',
              status: 'success',
              details: `Added to company partition (${meetingData.scope || 'client'} · ${
                meetingData.engagementType === 'one_time' ? 'One-Time Deal' : meetingData.cadence || 'monthly'
              })`,
            },
          ],
        };
        createdEvents.push(ev);

        if (i < count - 1) {
          cursorStart = addCadenceToDate(cursorStart, meetingData.cadence);
          cursorEnd = addCadenceToDate(cursorEnd, meetingData.cadence);
        }
      }

      setMeetings((prev) => [...createdEvents, ...prev]);

      const firstMeeting = createdEvents[0];
      const diffDays = getDaysDifference(firstMeeting.startTime, CURRENT_VIRTUAL_TIME);
      if (diffDays >= 0 && diffDays <= 1) {
        const client = clients.find((c) => c.id === firstMeeting.clientId);
        const comp = companies.find((co) => co.id === firstMeeting.companyId);
        const notif: AppNotification = {
          id: `adv-${Date.now()}`,
          type: 'meeting_advance',
          title: `24h Advance Notice: ${firstMeeting.title}`,
          message: `Meeting scheduled within 24 hours for ${client?.name || comp?.name || 'Team'}. Review pre-meeting agenda.`,
          timestamp: new Date().toISOString(),
          read: false,
          meetingId: firstMeeting.id,
          clientId: firstMeeting.clientId,
          companyId: firstMeeting.companyId,
          severity: 'info',
        };
        setNotifications((prev) => [notif, ...prev]);
      }

      return firstMeeting;
    },
    [clients, companies]
  );

  const updateMeeting = useCallback((id: string, updates: Partial<MeetingEvent>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, ...updates };
      })
    );
  }, []);

  const deleteMeeting = useCallback((id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const rescheduleMeeting = useCallback(
    (meetingId: string, options?: RescheduleOptions) => {
      const target = meetings.find((m) => m.id === meetingId);
      if (!target) return;

      const now = new Date();
      const nowIso = now.toISOString();
      const isAuto = options?.auto ?? true;
      const nextSlot =
        options?.customStartTime && options?.customEndTime
          ? { startTime: options.customStartTime, endTime: options.customEndTime }
          : computeNextRescheduleSlot(target.startTime, target.endTime, target.cadence, now);

      const originalStart = target.originalStartTime || target.startTime;
      const originalEnd = target.originalEndTime || target.endTime;

      const logEntry: AccountSyncLog = {
        id: `log-resched-${Date.now()}`,
        timestamp: nowIso,
        action: isAuto ? 'Auto-Rescheduled Missed Meeting' : 'Manually Rescheduled Meeting',
        status: 'success',
        details: `Moved from ${new Date(target.startTime).toLocaleString()} to ${new Date(
          nextSlot.startTime
        ).toLocaleString()}${options?.reason ? ` (${options.reason})` : ''}`,
      };

      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          return {
            ...m,
            status: 'scheduled',
            startTime: nextSlot.startTime,
            endTime: nextSlot.endTime,
            originalStartTime: originalStart,
            originalEndTime: originalEnd,
            autoRescheduled: isAuto,
            rescheduledAt: nowIso,
            rescheduleCount: (m.rescheduleCount || 0) + 1,
            rescheduleReason: options?.reason || m.rescheduleReason || 'Missed scheduled slot — moved to next valid time',
            syncLogs: [logEntry, ...(m.syncLogs || [])],
          };
        })
      );

      const comp = companies.find((c) => c.id === target.companyId);
      setNotifications((prev) => [
        {
          id: `notif-resched-${Date.now()}`,
          type: 'auto_reschedule',
          title: `${isAuto ? 'Auto-Rescheduled' : 'Rescheduled'}: ${target.title}`,
          message: `Missed slot (${new Date(originalStart).toLocaleDateString()}) moved to ${new Date(
            nextSlot.startTime
          ).toLocaleString()} (${comp?.name || 'Company'}).`,
          timestamp: nowIso,
          read: false,
          meetingId,
          companyId: target.companyId,
          clientId: target.clientId,
          severity: 'warning',
        },
        ...prev,
      ]);
    },
    [meetings, companies]
  );

  const markMeetingMissed = useCallback(
    (meetingId: string, autoRescheduleNow = false) => {
      if (autoRescheduleNow) {
        rescheduleMeeting(meetingId, {
          auto: true,
          reason: 'Meeting did not happen — automatically rescheduled',
        });
        return;
      }

      const nowIso = new Date().toISOString();
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          return {
            ...m,
            status: 'missed',
            originalStartTime: m.originalStartTime || m.startTime,
            originalEndTime: m.originalEndTime || m.endTime,
            rescheduleReason: 'Marked as Did Not Happen / Missed',
            syncLogs: [
              {
                id: `log-miss-${Date.now()}`,
                timestamp: nowIso,
                action: 'Marked Meeting as Missed',
                status: 'pending',
                details: 'Scheduled session did not take place; awaiting reschedule.',
              },
              ...(m.syncLogs || []),
            ],
          };
        })
      );
    },
    [rescheduleMeeting]
  );

  const runAutoRescheduleScan = useCallback((): number => {
    const now = new Date();
    const nowIso = now.toISOString();
    let count = 0;
    const newNotifs: AppNotification[] = [];

    setMeetings((prev) =>
      prev.map((m) => {
        const needsReschedule =
          m.status === 'missed' ||
          (m.startTime >= '2026-10-01' &&
            isMeetingOverdueUnheld(m, now) &&
            m.autoRescheduleEnabled !== false);

        if (!needsReschedule) return m;

        count++;
        const nextSlot = computeNextRescheduleSlot(m.startTime, m.endTime, m.cadence, now);
        const origStart = m.originalStartTime || m.startTime;
        const origEnd = m.originalEndTime || m.endTime;

        newNotifs.push({
          id: `auto-resched-${m.id}-${Date.now()}`,
          type: 'auto_reschedule',
          title: `Auto-Rescheduled: ${m.title}`,
          message: `Unheld slot (${new Date(origStart).toLocaleDateString()}) automatically moved to ${new Date(
            nextSlot.startTime
          ).toLocaleString()}.`,
          timestamp: nowIso,
          read: false,
          meetingId: m.id,
          companyId: m.companyId,
          clientId: m.clientId,
          severity: 'warning',
        });

        return {
          ...m,
          status: 'scheduled',
          startTime: nextSlot.startTime,
          endTime: nextSlot.endTime,
          originalStartTime: origStart,
          originalEndTime: origEnd,
          autoRescheduled: true,
          rescheduledAt: nowIso,
          rescheduleCount: (m.rescheduleCount || 0) + 1,
          rescheduleReason: 'Auto-rescheduled because scheduled time passed without completion',
          syncLogs: [
            {
              id: `log-autores-${m.id}-${Date.now()}`,
              timestamp: nowIso,
              action: 'Auto-Rescheduled Passed Meeting',
              status: 'success',
              details: `Previous ${new Date(origStart).toLocaleString()} -> New ${new Date(
                nextSlot.startTime
              ).toLocaleString()}`,
            },
            ...(m.syncLogs || []),
          ],
        };
      })
    );

    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev]);
    }
    return count;
  }, []);

  const updatePreNotes = useCallback((meetingId: string, preNotes: Partial<MeetingNotes['preMeeting']>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          notes: {
            ...m.notes,
            preMeeting: {
              ...m.notes.preMeeting,
              ...preNotes,
            },
          },
        };
      })
    );
  }, []);

  const updatePostNotes = useCallback((meetingId: string, postNotes: Partial<MeetingNotes['postMeeting']>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          notes: {
            ...m.notes,
            postMeeting: {
              ...m.notes.postMeeting,
              ...postNotes,
            },
          },
        };
      })
    );
  }, []);

  const sendPreMeetingBriefing = useCallback(
    (meetingId: string) => {
      const now = new Date().toISOString();
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          const newLog: AccountSyncLog = {
            id: `log-${Date.now()}`,
            timestamp: now,
            action: 'Dispatch Pre-Meeting Briefing',
            status: 'success',
            details: `Pre-meeting agenda dispatched to ${m.attendees.length} attendee(s) & customer inbox`,
          };
          return {
            ...m,
            notes: {
              ...m.notes,
              preMeeting: {
                ...m.notes.preMeeting,
                sentToAttendees: true,
                sentTimestamp: now,
              },
            },
            syncLogs: [newLog, ...m.syncLogs],
          };
        })
      );

      const targetMeeting = meetings.find((m) => m.id === meetingId);
      if (targetMeeting) {
        const notif: AppNotification = {
          id: `brief-sent-${Date.now()}`,
          type: 'notes_sync',
          title: `Pre-Meeting Brief Dispatched`,
          message: `Agenda and objectives for "${targetMeeting.title}" sent to attendees for advance record-keeping.`,
          timestamp: now,
          read: false,
          meetingId,
          companyId: targetMeeting.companyId,
          clientId: targetMeeting.clientId,
          severity: 'info',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    },
    [meetings]
  );

  const sendPostMeetingRecap = useCallback(
    (meetingId: string) => {
      const now = new Date().toISOString();
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          const actionCount = m.notes.postMeeting.actionItems.length;
          const decisionCount = m.notes.postMeeting.keyDecisions.length;
          const newLog: AccountSyncLog = {
            id: `log-${Date.now()}`,
            timestamp: now,
            action: 'Dispatch Post-Meeting Recap',
            status: 'success',
            details: `Post-meeting minutes sent (${decisionCount} decisions, ${actionCount} action items) to attendees`,
          };
          return {
            ...m,
            notes: {
              ...m.notes,
              postMeeting: {
                ...m.notes.postMeeting,
                sentToAttendees: true,
                sentTimestamp: now,
              },
            },
            syncLogs: [newLog, ...m.syncLogs],
          };
        })
      );

      const targetMeeting = meetings.find((m) => m.id === meetingId);
      if (targetMeeting) {
        const notif: AppNotification = {
          id: `recap-sent-${Date.now()}`,
          type: 'notes_sync',
          title: `Post-Meeting Recap Circulated`,
          message: `Decisions and action items for "${targetMeeting.title}" emailed to all stakeholders.`,
          timestamp: now,
          read: false,
          meetingId,
          companyId: targetMeeting.companyId,
          clientId: targetMeeting.clientId,
          severity: 'info',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    },
    [meetings]
  );

  const forwardPostMeetingMail = useCallback(
    (meetingId: string, payload: ForwardMailPayload) => {
      const targetMeeting = meetings.find((m) => m.id === meetingId);
      if (!targetMeeting) return;
      const comp = companies.find((c) => c.id === targetMeeting.companyId);
      const now = new Date().toISOString();
      const senderEmail = comp?.emailConfig?.senderEmail || comp?.accountExecutive.email || 'dispatch@omnical.internal';
      const subject =
        payload.subject?.trim() ||
        `[${comp?.name || 'Company'}] Work Assignment & Meeting Recap: ${targetMeeting.title}`;

      const record: ForwardedMailRecord = {
        id: `fwd-${Date.now()}`,
        to: payload.toEmails,
        cc: payload.ccEmails,
        subject,
        note: payload.note,
        sentAt: now,
        senderEmail,
        companyId: targetMeeting.companyId,
      };

      const logEntry: AccountSyncLog = {
        id: `log-fwd-${Date.now()}`,
        timestamp: now,
        action: `Forwarded Post-Meeting Work Mail (${comp?.name || 'Company'})`,
        status: 'success',
        details: `From: ${senderEmail} | To: ${payload.toEmails.join(', ') || 'None'} | CC: ${
          payload.ccEmails.join(', ') || 'None'
        }`,
      };

      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          return {
            ...m,
            notes: {
              ...m.notes,
              postMeeting: {
                ...m.notes.postMeeting,
                sentToAttendees: true,
                sentTimestamp: now,
                forwardedRecords: [record, ...(m.notes.postMeeting.forwardedRecords || [])],
              },
            },
            syncLogs: [logEntry, ...(m.syncLogs || [])],
          };
        })
      );

      setNotifications((prev) => [
        {
          id: `notif-fwd-${Date.now()}`,
          type: 'notes_sync',
          title: `Work Assignment Emailed (${comp?.name || 'Company'})`,
          message: `Post-meeting brief forwarded from ${senderEmail} to ${payload.toEmails.join(', ')}${
            payload.ccEmails.length ? ` (CC: ${payload.ccEmails.join(', ')})` : ''
          }.`,
          timestamp: now,
          read: false,
          meetingId,
          companyId: targetMeeting.companyId,
          clientId: targetMeeting.clientId,
          severity: 'info',
        },
        ...prev,
      ]);
    },
    [meetings, companies]
  );

  const syncNotesToAccount = useCallback(
    (meetingId: string, target: 'pre' | 'post' | 'both') => {
      const now = new Date().toISOString();
      const targetMeeting = meetings.find((m) => m.id === meetingId);
      const company = companies.find((c) => c.id === targetMeeting?.companyId);

      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;

          const preSynced = target === 'pre' || target === 'both' ? true : m.notes.preMeeting.syncedToAccount;
          const postSynced = target === 'post' || target === 'both' ? true : m.notes.postMeeting.syncedToAccount;

          const newLog: AccountSyncLog = {
            id: `log-${Date.now()}`,
            timestamp: now,
            action: `Sync Notes to Account (${company?.name || 'Company Profile'})`,
            status: 'success',
            details: `Two-way sync complete. Notes vaulted in ${company?.encryptionPartition || 'partition'} under account record.`,
          };

          return {
            ...m,
            notes: {
              preMeeting: {
                ...m.notes.preMeeting,
                syncedToAccount: preSynced,
                syncedTimestamp: target === 'pre' || target === 'both' ? now : m.notes.preMeeting.syncedTimestamp,
              },
              postMeeting: {
                ...m.notes.postMeeting,
                syncedToAccount: postSynced,
                syncedTimestamp: target === 'post' || target === 'both' ? now : m.notes.postMeeting.syncedTimestamp,
              },
            },
            syncLogs: [newLog, ...m.syncLogs],
          };
        })
      );

      if (targetMeeting) {
        const notif: AppNotification = {
          id: `sync-notes-${Date.now()}`,
          type: 'notes_sync',
          title: `Notes Synced Back to ${company?.name || 'Account'}`,
          message: `Record-keeping synchronization confirmed for "${targetMeeting.title}". All notes locked and archived in company profile.`,
          timestamp: now,
          read: false,
          meetingId,
          companyId: targetMeeting.companyId,
          clientId: targetMeeting.clientId,
          severity: 'info',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
    },
    [meetings, companies]
  );

  const setAttendeeStatus = useCallback((meetingId: string, attendeeId: string, status: AttendanceStatus) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          attendees: m.attendees.map((a) => (a.id === attendeeId ? { ...a, status } : a)),
        };
      })
    );
  }, []);

  const addClient = useCallback((clientData: Omit<Client, 'id'>): Client => {
    const primaryCompanyId =
      clientData.companyLinks && clientData.companyLinks.length > 0
        ? clientData.companyLinks[0].companyId
        : clientData.companyId;
    const newClient: Client = {
      ...clientData,
      companyId: primaryCompanyId,
      id: `cli-${Date.now()}`,
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const merged = { ...c, ...updates };
        if (merged.companyLinks && merged.companyLinks.length > 0) {
          merged.companyId = merged.companyLinks[0].companyId;
        }
        return merged;
      })
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const dispatchMonthlyUpdate = useCallback(
    (clientId: string) => {
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + 30);
      const nextDeadline = nextDate.toISOString().split('T')[0];
      const todayIso = now.toISOString().split('T')[0];

      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          return {
            ...c,
            lastMonthlyUpdateSent: todayIso,
            monthlyUpdateDeadline: nextDeadline,
            healthScore: Math.min(100, c.healthScore + 2),
          };
        })
      );

      const client = clients.find((c) => c.id === clientId);
      const comp = companies.find((co) => co.id === client?.companyId);

      const notif: AppNotification = {
        id: `update-dispatched-${Date.now()}`,
        type: 'notes_sync',
        title: `Mandatory Monthly Update Dispatched`,
        message: `Monthly SLA and progress dossier sent to ${client?.name || 'Client'}. Next deadline advanced to ${nextDeadline}.`,
        timestamp: new Date().toISOString(),
        read: false,
        clientId,
        companyId: comp?.id,
        severity: 'info',
      };
      setNotifications((prev) => [notif, ...prev]);
    },
    [clients, companies]
  );

  const recordQuarterlyReview = useCallback(
    (clientId: string) => {
      const now = new Date();
      const nextDate = new Date(now);
      nextDate.setDate(nextDate.getDate() + 90);
      const nextDeadline = nextDate.toISOString().split('T')[0];
      const todayIso = now.toISOString().split('T')[0];

      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          return {
            ...c,
            lastQuarterlyReviewHeld: todayIso,
            quarterlyReviewDeadline: nextDeadline,
            healthScore: Math.min(100, c.healthScore + 5),
          };
        })
      );

      const client = clients.find((c) => c.id === clientId);
      const notif: AppNotification = {
        id: `qbr-recorded-${Date.now()}`,
        type: 'notes_sync',
        title: `Quarterly Performance Review Completed`,
        message: `Executive QBR logged for ${client?.name || 'Client'}. Next review scheduled for ${nextDeadline}.`,
        timestamp: new Date().toISOString(),
        read: false,
        clientId,
        severity: 'info',
      };
      setNotifications((prev) => [notif, ...prev]);
    },
    [clients]
  );

  const runDeadlineScan = useCallback(() => {
    const newAlerts: AppNotification[] = [];
    const now = CURRENT_VIRTUAL_TIME;

    clients.forEach((c) => {
      const monthlyDays = getDaysDifference(c.monthlyUpdateDeadline, now);
      const quarterlyDays = getDaysDifference(c.quarterlyReviewDeadline, now);

      if (c.tier === 'A') {
        if (monthlyDays < 0) {
          newAlerts.push({
            id: `alert-overdue-${c.id}-${Date.now()}`,
            type: 'tier_a_deadline',
            title: `OVERDUE: Tier A Monthly Update (${c.name})`,
            message: `Mandatory monthly update expired ${Math.abs(monthlyDays)} day(s) ago! Action required immediately.`,
            timestamp: new Date().toISOString(),
            read: false,
            clientId: c.id,
            companyId: c.companyId,
            severity: 'urgent',
          });
        } else if (monthlyDays <= 3) {
          newAlerts.push({
            id: `alert-imminent-${c.id}-${Date.now()}`,
            type: 'tier_a_deadline',
            title: `Tier A Deadline in ${monthlyDays} days (${c.name})`,
            message: `Monthly SLA and status update due on ${c.monthlyUpdateDeadline}. Prepare and dispatch briefing.`,
            timestamp: new Date().toISOString(),
            read: false,
            clientId: c.id,
            companyId: c.companyId,
            severity: 'warning',
          });
        }

        if (quarterlyDays <= 7 && quarterlyDays >= 0) {
          newAlerts.push({
            id: `alert-qbr-${c.id}-${Date.now()}`,
            type: 'tier_a_deadline',
            title: `Tier A Quarterly Review Approaching (${c.name})`,
            message: `Comprehensive QBR due in ${quarterlyDays} days. Schedule executive attendance.`,
            timestamp: new Date().toISOString(),
            read: false,
            clientId: c.id,
            companyId: c.companyId,
            severity: 'warning',
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setNotifications((prev) => [...newAlerts, ...prev]);
    }
  }, [clients]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const triggerManualTestAlert = useCallback(
    (type: '24h_advance' | 'pre_start' | 'tier_a_deadline') => {
      const nowIso = new Date().toISOString();
      let alert: AppNotification;

      if (type === '24h_advance') {
        alert = {
          id: `test-24h-${Date.now()}`,
          type: 'meeting_advance',
          title: '24-Hour Advance Alert: Executive Strategy Session',
          message: 'Meeting begins tomorrow at 11:00 AM IST. Pre-meeting notes are ready for review.',
          timestamp: nowIso,
          read: false,
          severity: 'info',
        };
      } else if (type === 'pre_start') {
        alert = {
          id: `test-pre-${Date.now()}`,
          type: 'meeting_imminent',
          title: 'Meeting Starts in 15 Minutes',
          message: 'Mandatory Monthly Review starting shortly. Please ensure agenda is sent and notes synced.',
          timestamp: nowIso,
          read: false,
          severity: 'warning',
        };
      } else {
        alert = {
          id: `test-tier-a-${Date.now()}`,
          type: 'tier_a_deadline',
          title: 'Tier A Automated Deadline Reminder',
          message: 'Category A quarterly performance review deadline is in 5 business days. Schedule executive signoff.',
          timestamp: nowIso,
          read: false,
          severity: 'urgent',
        };
      }

      setNotifications((prev) => [alert, ...prev]);
    },
    []
  );

  // Company CRUD
  const addCompany = useCallback((comp: Omit<CompanyProfile, 'id' | 'syncStatus' | 'lastSyncedAt'>): CompanyProfile => {
    const newComp: CompanyProfile = {
      ...comp,
      id: `comp-${Date.now()}`,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
      departments: comp.departments || [],
      workAssignees: comp.workAssignees || [
        {
          id: `wa-${Date.now()}`,
          name: comp.accountExecutive.name,
          email: comp.accountExecutive.email,
          role: comp.accountExecutive.role || 'Account Director',
          defaultCc: true,
        },
      ],
    };
    setCompanies((prev) => [...prev, newComp]);
    setVisibleCalendarIds((prev) => (prev.includes(newComp.id) ? prev : [...prev, newComp.id]));
    return newComp;
  }, []);

  const updateCompany = useCallback((id: string, updates: Partial<CompanyProfile>) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...updates };
      })
    );
  }, []);

  const deleteCompany = useCallback(
    (id: string) => {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setVisibleCalendarIds((prev) => prev.filter((cid) => cid !== id));
      if (selectedCompanyId === id) {
        setSelectedCompanyId('ALL');
      }
      // Clean company links from clients
      setClients((prev) =>
        prev.map((cl) => ({
          ...cl,
          companyLinks: cl.companyLinks?.filter((l) => l.companyId !== id),
        }))
      );
    },
    [selectedCompanyId]
  );

  // Department CRUD
  const addDepartment = useCallback((companyId: string, dept: Omit<Department, 'id'>): Department => {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
    };
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId ? { ...c, departments: [...(c.departments || []), newDept] } : c
      )
    );
    return newDept;
  }, []);

  const updateDepartment = useCallback(
    (companyId: string, deptId: string, updates: Partial<Department>) => {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            departments: (c.departments || []).map((d) => (d.id === deptId ? { ...d, ...updates } : d)),
          };
        })
      );
    },
    []
  );

  const deleteDepartment = useCallback((companyId: string, deptId: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, departments: (c.departments || []).filter((d) => d.id !== deptId) }
          : c
      )
    );
  }, []);

  // Work Assignee CRUD (company-wise)
  const addWorkAssignee = useCallback((companyId: string, assignee: Omit<WorkAssignee, 'id'>): WorkAssignee => {
    const newAssignee: WorkAssignee = {
      ...assignee,
      id: `wa-${Date.now()}`,
    };
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, workAssignees: [...(c.workAssignees || []), newAssignee] }
          : c
      )
    );
    return newAssignee;
  }, []);

  const updateWorkAssignee = useCallback(
    (companyId: string, assigneeId: string, updates: Partial<WorkAssignee>) => {
      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          return {
            ...c,
            workAssignees: (c.workAssignees || []).map((w) =>
              w.id === assigneeId ? { ...w, ...updates } : w
            ),
          };
        })
      );
    },
    []
  );

  const deleteWorkAssignee = useCallback((companyId: string, assigneeId: string) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, workAssignees: (c.workAssignees || []).filter((w) => w.id !== assigneeId) }
          : c
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        companies,
        clients,
        meetings,
        notifications,
        selectedCompanyId,
        setSelectedCompanyId,
        selectedTier,
        setSelectedTier,
        isSyncing,
        syncAllCalendars,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        rescheduleMeeting,
        markMeetingMissed,
        runAutoRescheduleScan,
        overdueOrMissedMeetings,
        updatePreNotes,
        updatePostNotes,
        sendPreMeetingBriefing,
        sendPostMeetingRecap,
        forwardPostMeetingMail,
        syncNotesToAccount,
        setAttendeeStatus,
        addClient,
        updateClient,
        deleteClient,
        getClientsForCompany,
        dispatchMonthlyUpdate,
        recordQuarterlyReview,
        runDeadlineScan,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotification,
        triggerManualTestAlert,
        addCompany,
        updateCompany,
        deleteCompany,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addWorkAssignee,
        updateWorkAssignee,
        deleteWorkAssignee,
        currentCompany,
        filteredMeetings,
        filteredClients,
        visibleCalendarIds,
        toggleCalendarVisibility,
        selectAllCalendars,
        deselectAllCalendars,
        tierAUpcomingDeadlinesCount,
        unreadNotificationsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
