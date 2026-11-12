export type ClientTier = 'A' | 'B' | 'C';

export type MeetingType =
  | 'Quarterly Review'
  | 'Monthly Update'
  | 'Executive Follow-up'
  | 'Strategy Alignment'
  | 'Operational Check-in'
  | 'Annual Health Check';

export type AttendanceStatus = 'attended' | 'absent' | 'excused' | 'pending';

export type SyncState = 'synced' | 'syncing' | 'error' | 'idle';

export type EmailProviderType = 'smtp' | 'google_workspace' | 'microsoft365' | 'resend' | 'sendgrid';

export interface EmailGatewayConfig {
  provider: EmailProviderType;
  senderName: string;
  senderEmail: string;
  replyToEmail?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPasswordMasked?: string;
  apiKeyMasked?: string;
  secure: boolean;
  ccList: string[]; // Team members to CC on meeting briefs/recaps
  bccList: string[];
  status: 'connected' | 'unconfigured' | 'testing';
  lastTestedAt?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  brandColor: string; // Tailwind color name (e.g. 'indigo', 'emerald', 'sky')
  accentHex: string;
  timezone: string;
  calendarFeedUrl: string;
  syncStatus: SyncState;
  lastSyncedAt: string;
  encryptionPartition: string;
  accountExecutive: {
    name: string;
    email: string;
    role: string;
  };
  emailConfig?: EmailGatewayConfig;
  syncSettings: {
    syncPreMeetingBriefs: boolean;
    syncPostMeetingRecaps: boolean;
    reminderHoursAhead: number; // e.g. 24
  };
  clientCount?: number;
  meetingCount?: number;
}

export interface ClientContact {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  tier: ClientTier;
  industry: string;
  contact: ClientContact;
  monthlyUpdateDeadline: string; // ISO date string: YYYY-MM-DD
  lastMonthlyUpdateSent: string | null;
  quarterlyReviewDeadline: string; // ISO date string: YYYY-MM-DD
  lastQuarterlyReviewHeld: string | null;
  healthScore: number; // 0 - 100
  annualContractValue: number; // in USD
  notes: string;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  company: string;
  status: AttendanceStatus;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export interface MeetingNotes {
  preMeeting: {
    agenda: string;
    objectives: string[];
    talkingPoints: string;
    preReadLinks: string[];
    sentToAttendees: boolean;
    sentTimestamp?: string;
    syncedToAccount: boolean;
    syncedTimestamp?: string;
  };
  postMeeting: {
    summary: string;
    keyDecisions: string[];
    actionItems: ActionItem[];
    followUpCommitment: string;
    sentToAttendees: boolean;
    sentTimestamp?: string;
    syncedToAccount: boolean;
    syncedTimestamp?: string;
  };
}

export interface AccountSyncLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'pending' | 'failed';
  details: string;
}

export interface MeetingEvent {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  description: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  location: string;
  meetingType: MeetingType;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  attendees: Attendee[];
  notes: MeetingNotes;
  syncLogs: AccountSyncLog[];
  notifications: {
    dayBeforeSent: boolean;
    hourBeforeSent: boolean;
  };
}

export interface AppNotification {
  id: string;
  type: 'meeting_advance' | 'meeting_imminent' | 'tier_a_deadline' | 'notes_sync' | 'sync_complete';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meetingId?: string;
  clientId?: string;
  companyId?: string;
  severity: 'info' | 'warning' | 'urgent';
}
