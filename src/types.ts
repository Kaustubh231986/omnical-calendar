export type ClientTier = 'A' | 'B' | 'C';

export type CadenceFrequency =
  | 'one_time'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'yearly';

export type DealEngagementType = 'one_time' | 'recurring';

export type MeetingScope = 'client' | 'company' | 'department';

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

export interface Department {
  id: string;
  name: string;
  headName: string;
  headEmail: string;
  meetingCadence: CadenceFrequency;
  preferredTime?: string; // e.g. "15:00"
  description?: string;
}

export interface WorkAssignee {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  defaultCc?: boolean;
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug: string;
  tier?: ClientTier;
  brandColor: string; // Tailwind color name (e.g. 'indigo', 'emerald', 'sky')
  accentHex: string;
  timezone: string;
  calendarFeedUrl: string;
  syncStatus: SyncState;
  lastSyncedAt: string;
  encryptionPartition: string;
  meetingCadence?: CadenceFrequency;
  autoRescheduleMissed?: boolean;
  departments?: Department[];
  workAssignees?: WorkAssignee[];
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

export interface ClientCompanyLink {
  companyId: string;
  serviceScope: string; // e.g. "Financial Planning", "Property Management Services"
  engagementType: DealEngagementType;
  cadence: CadenceFrequency;
  departmentId?: string;
  status?: 'active' | 'completed';
}

export interface Client {
  id: string;
  companyId: string; // Primary company ID
  companyLinks?: ClientCompanyLink[]; // Supports 1, 2, 3+ company engagements with distinct services
  name: string;
  tier: ClientTier;
  industry: string;
  address?: string;
  engagementType?: DealEngagementType;
  cadence?: CadenceFrequency;
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
  assigneeEmail?: string;
  dueDate: string;
  completed: boolean;
}

export interface ForwardedMailRecord {
  id: string;
  to: string[];
  cc: string[];
  subject: string;
  note: string;
  sentAt: string;
  senderEmail: string;
  companyId: string;
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
    forwardedRecords?: ForwardedMailRecord[];
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
  clientId: string; // May be '' for pure internal company/department meetings
  scope?: MeetingScope; // 'client' | 'company' | 'department'
  departmentId?: string;
  serviceScope?: string; // e.g. "Financial Planning" or "Property Management Services"
  engagementType?: DealEngagementType; // 'one_time' | 'recurring'
  cadence?: CadenceFrequency; // 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'half_yearly' | 'yearly'
  title: string;
  description: string;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  location: string;
  meetingType: MeetingType;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'missed';
  autoRescheduleEnabled?: boolean;
  autoRescheduled?: boolean;
  originalStartTime?: string;
  originalEndTime?: string;
  rescheduledAt?: string;
  rescheduleCount?: number;
  rescheduleReason?: string;
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
  type: 'meeting_advance' | 'meeting_imminent' | 'tier_a_deadline' | 'notes_sync' | 'sync_complete' | 'auto_reschedule';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meetingId?: string;
  clientId?: string;
  companyId?: string;
  severity: 'info' | 'warning' | 'urgent';
}
