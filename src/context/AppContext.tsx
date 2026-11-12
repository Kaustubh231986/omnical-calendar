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
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_CLIENTS,
  INITIAL_MEETINGS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { CURRENT_VIRTUAL_TIME, getDaysDifference } from '../utils/calendarUtils';

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
  addMeeting: (meetingData: Omit<MeetingEvent, 'id' | 'syncLogs' | 'notifications'>) => MeetingEvent;
  updateMeeting: (id: string, updates: Partial<MeetingEvent>) => void;
  deleteMeeting: (id: string) => void;
  
  // Notes & Sync actions
  updatePreNotes: (meetingId: string, preNotes: Partial<MeetingNotes['preMeeting']>) => void;
  updatePostNotes: (meetingId: string, postNotes: Partial<MeetingNotes['postMeeting']>) => void;
  sendPreMeetingBriefing: (meetingId: string) => void;
  sendPostMeetingRecap: (meetingId: string) => void;
  syncNotesToAccount: (meetingId: string, target: 'pre' | 'post' | 'both') => void;
  
  // Attendance actions
  setAttendeeStatus: (meetingId: string, attendeeId: string, status: AttendanceStatus) => void;
  
  // Client & Tier actions
  addClient: (clientData: Omit<Client, 'id'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  dispatchMonthlyUpdate: (clientId: string) => void;
  recordQuarterlyReview: (clientId: string) => void;
  runDeadlineScan: () => void;
  
  // Notifications actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;
  triggerManualTestAlert: (type: '24h_advance' | 'pre_start' | 'tier_a_deadline') => void;
  
  // Company actions
  addCompany: (comp: Omit<CompanyProfile, 'id' | 'syncStatus' | 'lastSyncedAt'>) => void;
  updateCompany: (id: string, updates: Partial<CompanyProfile>) => void;

  // Multi-calendar visibility controls (Google Calendar style checkboxes)
  visibleCalendarIds: string[];
  toggleCalendarVisibility: (companyId: string) => void;
  selectAllCalendars: () => void;
  deselectAllCalendars: () => void;
  
  // Active selected company profile (if not 'ALL')
  currentCompany: CompanyProfile | null;
  filteredMeetings: MeetingEvent[];
  filteredClients: Client[];
  tierAUpcomingDeadlinesCount: number;
  unreadNotificationsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANIES: 'omnical_companies_v2',
  CLIENTS: 'omnical_clients_v2',
  MEETINGS: 'omnical_meetings_v2',
  NOTIFICATIONS: 'omnical_notifications_v2',
  VISIBLE_CALS: 'omnical_visible_cals_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with seed data
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

  // Track which calendars are checked in the left sidebar (default all checked)
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

  // Sync to localStorage
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

  // Current company profile if isolated
  const currentCompany = useMemo(() => {
    if (selectedCompanyId === 'ALL') return null;
    return companies.find((c) => c.id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Filtered meetings by company and client tier and multi-calendar checkboxes
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // Company profile isolation
      if (selectedCompanyId !== 'ALL') {
        if (m.companyId !== selectedCompanyId) return false;
      } else {
        // Multi-calendar visibility checkbox filter
        if (!visibleCalendarIds.includes(m.companyId)) return false;
      }
      // Tier filtering
      if (selectedTier !== 'ALL') {
        const client = clients.find((c) => c.id === m.clientId);
        if (client && client.tier !== selectedTier) {
          return false;
        }
      }
      return true;
    });
  }, [meetings, clients, selectedCompanyId, selectedTier, visibleCalendarIds]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (selectedCompanyId !== 'ALL') {
        if (c.companyId !== selectedCompanyId) return false;
      } else {
        if (!visibleCalendarIds.includes(c.companyId)) return false;
      }
      if (selectedTier !== 'ALL' && c.tier !== selectedTier) {
        return false;
      }
      return true;
    });
  }, [clients, selectedCompanyId, selectedTier, visibleCalendarIds]);

  // Tier A upcoming / overdue deadlines count
  const tierAUpcomingDeadlinesCount = useMemo(() => {
    return clients
      .filter((c) => (selectedCompanyId === 'ALL' || c.companyId === selectedCompanyId) && c.tier === 'A')
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

  // Unified Calendar Synchronizer
  const syncAllCalendars = useCallback(async () => {
    setIsSyncing(true);
    // Simulate multi-company network handshake
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const timestamp = new Date().toISOString();
    setCompanies((prev) =>
      prev.map((c) => ({
        ...c,
        syncStatus: 'synced',
        lastSyncedAt: timestamp,
      }))
    );

    // Add notification
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

  // Add meeting
  const addMeeting = useCallback(
    (meetingData: Omit<MeetingEvent, 'id' | 'syncLogs' | 'notifications'>) => {
      const newId = `meet-${Date.now()}`;
      const newMeeting: MeetingEvent = {
        ...meetingData,
        id: newId,
        notifications: {
          dayBeforeSent: false,
          hourBeforeSent: false,
        },
        syncLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'Event Created & Scheduled',
            status: 'success',
            details: 'Event added to Unified Master Schedule and isolated company partition',
          },
        ],
      };

      setMeetings((prev) => [newMeeting, ...prev]);

      // Check if meeting is scheduled within next 24 hours to generate advance notification
      const diffDays = getDaysDifference(newMeeting.startTime, CURRENT_VIRTUAL_TIME);
      if (diffDays >= 0 && diffDays <= 1) {
        const client = clients.find((c) => c.id === newMeeting.clientId);
        const comp = companies.find((c) => c.id === newMeeting.companyId);
        const notif: AppNotification = {
          id: `adv-${Date.now()}`,
          type: 'meeting_advance',
          title: `24h Advance Notice: ${newMeeting.title}`,
          message: `Meeting scheduled within 24 hours for ${client?.name || 'Client'} (${comp?.name}). Review pre-meeting agenda.`,
          timestamp: new Date().toISOString(),
          read: false,
          meetingId: newId,
          clientId: newMeeting.clientId,
          companyId: newMeeting.companyId,
          severity: 'info',
        };
        setNotifications((prev) => [notif, ...prev]);
      }

      return newMeeting;
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

  // Update Pre-meeting Notes
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

  // Update Post-meeting Notes
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

  // Send Pre-Meeting Briefing
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

  // Send Post-Meeting Recap
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

  // Sync Notes back to company account
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

  // Set Attendee Status
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

  // Add Client
  const addClient = useCallback((clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
    };
    setClients((prev) => [newClient, ...prev]);
  }, []);

  // Update Client
  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...updates };
      })
    );
  }, []);

  // Dispatch Tier A / Monthly Update (resets cadence and advances deadline by 30 days)
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

  // Record completed Quarterly Review (advances deadline by 90 days)
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

  // Run automated deadline check for all clients
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

  // Notifications helper
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Manual test alert trigger to demonstrate before-meeting alerts and deadline reminders
  const triggerManualTestAlert = useCallback(
    (type: '24h_advance' | 'pre_start' | 'tier_a_deadline') => {
      const nowIso = new Date().toISOString();
      let alert: AppNotification;

      if (type === '24h_advance') {
        alert = {
          id: `test-24h-${Date.now()}`,
          type: 'meeting_advance',
          title: '24-Hour Advance Alert: Executive Strategy Session',
          message: 'Meeting with Nexus Cloud Systems begins tomorrow at 11:00 AM EDT. Pre-meeting notes are ready for review.',
          timestamp: nowIso,
          read: false,
          severity: 'info',
        };
      } else if (type === 'pre_start') {
        alert = {
          id: `test-pre-${Date.now()}`,
          type: 'meeting_imminent',
          title: 'Meeting Starts in 15 Minutes: Starlight Financial',
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
          message: 'TransOcean Maritime Holdings quarterly performance audit deadline is in 5 business days. Schedule executive signoff.',
          timestamp: nowIso,
          read: false,
          severity: 'urgent',
        };
      }

      setNotifications((prev) => [alert, ...prev]);
    },
    []
  );

  // Company management
  const addCompany = useCallback((comp: Omit<CompanyProfile, 'id' | 'syncStatus' | 'lastSyncedAt'>) => {
    const newComp: CompanyProfile = {
      ...comp,
      id: `comp-${Date.now()}`,
      syncStatus: 'synced',
      lastSyncedAt: new Date().toISOString(),
    };
    setCompanies((prev) => [...prev, newComp]);
  }, []);

  const updateCompany = useCallback((id: string, updates: Partial<CompanyProfile>) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...updates };
      })
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
        updatePreNotes,
        updatePostNotes,
        sendPreMeetingBriefing,
        sendPostMeetingRecap,
        syncNotesToAccount,
        setAttendeeStatus,
        addClient,
        updateClient,
        dispatchMonthlyUpdate,
        recordQuarterlyReview,
        runDeadlineScan,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotification,
        triggerManualTestAlert,
        addCompany,
        updateCompany,
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
