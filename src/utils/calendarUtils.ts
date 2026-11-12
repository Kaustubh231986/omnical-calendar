import { MeetingEvent, CompanyProfile, Client } from '../types';

export const CURRENT_VIRTUAL_TIME = new Date();

export function formatDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export interface DayColumnInfo {
  dayName: string;
  dayNumber: number;
  dateString: string;
  isToday: boolean;
  fullDate: Date;
}

export function getDaysWindow(baseDate: Date, count = 4): DayColumnInfo[] {
  const days: DayColumnInfo[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const dateString = formatDateIso(d);
    days.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNumber: d.getDate(),
      dateString,
      isToday: isSameDay(d, today),
      fullDate: d,
    });
  }
  return days;
}

export interface MonthGridCell {
  dayNumber: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
}

export function getMonthMatrix(year: number, month: number): MonthGridCell[] {
  const today = new Date();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  const cells: MonthGridCell[] = [];

  // Trailing previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    cells.push({
      dayNumber: d.getDate(),
      dateString: formatDateIso(d),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      fullDate: d,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({
      dayNumber: day,
      dateString: formatDateIso(d),
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      fullDate: d,
    });
  }

  // Leading next month days to complete 5 or 6 weeks (35 or 42 grid cells)
  const targetTotal = cells.length > 35 ? 42 : 35;
  const remaining = targetTotal - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(year, month + 1, day);
    cells.push({
      dayNumber: day,
      dateString: formatDateIso(d),
      isCurrentMonth: false,
      isToday: isSameDay(d, today),
      fullDate: d,
    });
  }

  return cells;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  
  const startStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startStr} – ${endStr}`;
}

export function formatDateLabel(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysDifference(targetDateIso: string, fromDate = CURRENT_VIRTUAL_TIME): number {
  const target = new Date(targetDateIso);
  // Compare at midnight
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const fromMidnight = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  
  const diffTime = targetMidnight.getTime() - fromMidnight.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getDeadlineBadge(targetDateIso: string) {
  const days = getDaysDifference(targetDateIso);
  if (days < 0) {
    return {
      status: 'overdue' as const,
      label: `Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`,
      colorClass: 'text-rose-400 font-medium',
      bgClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      days,
    };
  } else if (days === 0) {
    return {
      status: 'due_today' as const,
      label: 'Due Today',
      colorClass: 'text-amber-400 font-medium',
      bgClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      days,
    };
  } else if (days <= 7) {
    return {
      status: 'imminent' as const,
      label: `Due in ${days} day${days > 1 ? 's' : ''}`,
      colorClass: 'text-amber-300 font-medium',
      bgClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
      days,
    };
  } else {
    return {
      status: 'on_track' as const,
      label: `In ${days} days (${formatDateLabel(targetDateIso)})`,
      colorClass: 'text-neutral-400',
      bgClass: 'bg-neutral-800 text-neutral-300 border border-neutral-700/50',
      days,
    };
  }
}

/**
 * Generates RFC 5545 compliant iCalendar content (.ics)
 */
export function generateMasterIcs(meetings: MeetingEvent[], company?: CompanyProfile): string {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  const formatIcsDate = (date: Date) => {
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  };

  const calName = company
    ? `${company.name} Isolated Calendar Feed`
    : 'OmniCal Unified Master Schedule';

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OmniCal Enterprise//Multi-Company Calendar Master//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    `X-WR-TIMEZONE:UTC`,
  ];

  meetings.forEach((m) => {
    const start = new Date(m.startTime);
    const end = new Date(m.endTime);
    const now = new Date();

    const cleanDescription = (m.description + '\n\n' + (m.notes.preMeeting.agenda ? `Pre-Meeting Agenda:\n${m.notes.preMeeting.agenda}` : ''))
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,');

    ics.push(
      'BEGIN:VEVENT',
      `UID:${m.id}@omnical.enterprise`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${m.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${cleanDescription}`,
      `LOCATION:${m.location.replace(/,/g, '\\,')}`,
      `STATUS:${m.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Downloads a file to client
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/calendar') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates CSV export for historical logs
 */
export function generateLogsCsv(meetings: MeetingEvent[], companies: CompanyProfile[], clients: Client[]): string {
  const companyMap = new Map(companies.map(c => [c.id, c.name]));
  const clientMap = new Map(clients.map(cl => [cl.id, cl]));

  const headers = [
    'Meeting ID',
    'Company',
    'Client',
    'Client Tier',
    'Title',
    'Type',
    'Status',
    'Date',
    'Start Time',
    'End Time',
    'Total Attendees',
    'Attended Count',
    'Attendance Rate %',
    'Pre-Notes Synced',
    'Post-Notes Synced',
    'Decisions Count',
    'Action Items Count'
  ];

  const rows = meetings.map(m => {
    const client = clientMap.get(m.clientId);
    const companyName = companyMap.get(m.companyId) || 'Unknown';
    const totalAttendees = m.attendees.length;
    const attended = m.attendees.filter(a => a.status === 'attended').length;
    const rate = totalAttendees > 0 ? Math.round((attended / totalAttendees) * 100) : 0;
    
    return [
      `"${m.id}"`,
      `"${companyName}"`,
      `"${client?.name || 'N/A'}"`,
      `"${client?.tier || 'N/A'}"`,
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.meetingType}"`,
      `"${m.status}"`,
      `"${new Date(m.startTime).toLocaleDateString()}"`,
      `"${new Date(m.startTime).toLocaleTimeString()}"`,
      `"${new Date(m.endTime).toLocaleTimeString()}"`,
      totalAttendees,
      attended,
      `${rate}%`,
      m.notes.preMeeting.syncedToAccount ? 'Yes' : 'No',
      m.notes.postMeeting.syncedToAccount ? 'Yes' : 'No',
      m.notes.postMeeting.keyDecisions.length,
      m.notes.postMeeting.actionItems.length
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
