import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MeetingEvent, ClientTier } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Users,
  Send,
  RefreshCw,
  Plus,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CURRENT_VIRTUAL_TIME,
  formatTimeRange,
  formatDateLabel,
  generateMasterIcs,
  triggerFileDownload,
} from '../../utils/calendarUtils';

interface CalendarViewProps {
  onOpenMeeting: (id: string) => void;
  onOpenNewMeeting: (date?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenMeeting,
  onOpenNewMeeting,
}) => {
  const {
    filteredMeetings,
    companies,
    clients,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedTier,
    setSelectedTier,
    currentCompany,
    visibleCalendarIds,
    toggleCalendarVisibility,
    selectAllCalendars,
    deselectAllCalendars,
    sendPreMeetingBriefing,
    sendPostMeetingRecap,
    syncNotesToAccount,
  } = useApp();

  // Default to 4-day view matching the user's sample calendar screenshot!
  const [viewMode, setViewMode] = useState<'4day' | 'month' | 'agenda'>('4day');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-05T00:00:00'));
  const [myCalendarsExpanded, setMyCalendarsExpanded] = useState(true);

  // Company and client lookup maps
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const clientMap = new Map(clients.map((cl) => [cl.id, cl]));

  // Export iCalendar .ics file
  const handleExportIcs = () => {
    const icsContent = generateMasterIcs(filteredMeetings, currentCompany || undefined);
    const filename = currentCompany
      ? `${currentCompany.slug}-calendar.ics`
      : 'unified-master-schedule.ics';
    triggerFileDownload(icsContent, filename, 'text/calendar');
  };

  // Sample calendar 4 days matching the user's uploaded image:
  // Saturday 5, Sunday 6, Monday 7, Tuesday 8 (September 2026)
  const sampleFourDays = [
    { dayName: 'SAT', dayNumber: 5, dateString: '2026-09-05', isToday: true },
    { dayName: 'SUN', dayNumber: 6, dateString: '2026-09-06', isToday: false },
    { dayName: 'MON', dayNumber: 7, dateString: '2026-09-07', isToday: false },
    { dayName: 'TUE', dayNumber: 8, dateString: '2026-09-08', isToday: false },
  ];

  // Hours displayed on the grid (matching user's screenshot: 9 AM to 11 PM)
  const hours = [
    { label: '9 AM', hour24: 9 },
    { label: '10 AM', hour24: 10 },
    { label: '11 AM', hour24: 11 },
    { label: '12 PM', hour24: 12 },
    { label: '1 PM', hour24: 13 },
    { label: '2 PM', hour24: 14 },
    { label: '3 PM', hour24: 15 },
    { label: '4 PM', hour24: 16 },
    { label: '5 PM', hour24: 17 },
    { label: '6 PM', hour24: 18 },
    { label: '7 PM', hour24: 19 },
    { label: '8 PM', hour24: 20 },
    { label: '9 PM', hour24: 21 },
    { label: '10 PM', hour24: 22 },
    { label: '11 PM', hour24: 23 },
  ];

  // Helper to calculate top position and height in px for 4-day hourly grid
  // Grid starts at 9:00 AM (0px), each hour is 64px
  const getEventPositionStyle = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);

    // Compute minutes from 9:00 AM
    const startMinutes = (start.getHours() - 9) * 60 + start.getMinutes();
    const endMinutes = (end.getHours() - 9) * 60 + end.getMinutes();
    const durationMinutes = Math.max(30, endMinutes - startMinutes);

    const topPx = (startMinutes / 60) * 64;
    const heightPx = (durationMinutes / 60) * 64;

    return {
      top: `${Math.max(0, topPx)}px`,
      height: `${Math.max(26, heightPx)}px`,
    };
  };

  // Helper to find meetings for a specific day
  const getMeetingsForDay = (dateString: string) => {
    return filteredMeetings.filter((m) => m.startTime.startsWith(dateString));
  };

  // Month navigation calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays: Array<{ dayNumber: number; dateString: string; isCurrentMonth: boolean }> = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const padD = day < 10 ? `0${day}` : `${day}`;
    calendarDays.push({
      dayNumber: day,
      dateString: `2026-08-${padD}`,
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const padM = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const padD = d < 10 ? `0${d}` : `${d}`;
    calendarDays.push({
      dayNumber: d,
      dateString: `${year}-${padM}-${padD}`,
      isCurrentMonth: true,
    });
  }
  const remaining = 35 - calendarDays.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      const padD = d < 10 ? `0${d}` : `${d}`;
      calendarDays.push({
        dayNumber: d,
        dateString: `2026-10-${padD}`,
        isCurrentMonth: false,
      });
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* ======================================================== */}
      {/* GOOGLE CALENDAR LEFT SIDEBAR: "My calendars" (Profiles)  */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-72 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shrink-0 shadow-xs space-y-4">
        {/* + Create Button */}
        <button
          onClick={() => onOpenNewMeeting('2026-09-05')}
          className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-2xl border border-neutral-700 font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-neutral-600"
        >
          <span className="text-base font-bold text-indigo-400">+</span>
          <span className="font-semibold text-sm">Create</span>
        </button>

        {/* Mini Calendar Header / Navigation */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-neutral-200">September 2026</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(new Date('2026-09-01'))}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date('2026-10-01'))}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] text-neutral-500 font-medium py-1">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] gap-y-1 font-mono">
            {calendarDays.slice(0, 28).map((cd, i) => {
              const isSelectedDay = cd.dayNumber >= 5 && cd.dayNumber <= 8 && cd.isCurrentMonth;
              const isToday = cd.dayNumber === 5 && cd.isCurrentMonth;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentDate(new Date(cd.dateString))}
                  className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-blue-600 text-white font-bold'
                      : isSelectedDay
                      ? 'bg-blue-950/60 text-blue-300'
                      : cd.isCurrentMonth
                      ? 'text-neutral-300 hover:bg-neutral-800'
                      : 'text-neutral-600'
                  }`}
                >
                  {cd.dayNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* "My calendars" section with individual company checkboxes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold">
            <button
              onClick={() => setMyCalendarsExpanded(!myCalendarsExpanded)}
              className="flex items-center gap-1.5 hover:text-white cursor-pointer"
            >
              <span>My calendars</span>
              {myCalendarsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              )}
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <button
                onClick={selectAllCalendars}
                className="hover:text-indigo-400 cursor-pointer"
                title="Select all company calendars"
              >
                All
              </button>
              <span>·</span>
              <button
                onClick={deselectAllCalendars}
                className="hover:text-indigo-400 cursor-pointer"
                title="Deselect all calendars"
              >
                None
              </button>
            </div>
          </div>

          {/* Calendar Checkbox List matching Screenshot */}
          {myCalendarsExpanded && (
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 text-xs">
              {companies.map((comp) => {
                const isChecked = visibleCalendarIds.includes(comp.id);
                const isIsolated = selectedCompanyId === comp.id;

                return (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between group py-1 px-1.5 rounded hover:bg-neutral-850/60 transition-colors"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <div
                        onClick={() => toggleCalendarVisibility(comp.id)}
                        className="w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          backgroundColor: isChecked ? comp.accentHex : 'transparent',
                          borderColor: comp.accentHex,
                        }}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>

                      <span
                        className={`truncate text-xs ${
                          isChecked ? 'text-neutral-200' : 'text-neutral-500'
                        }`}
                        title={comp.name}
                      >
                        {comp.name}
                      </span>
                    </label>

                    {/* Quick drill-down into isolated tenant mode */}
                    <button
                      onClick={() => setSelectedCompanyId(isIsolated ? 'ALL' : comp.id)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        isIsolated
                          ? 'bg-indigo-500 text-white opacity-100'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                      title={isIsolated ? 'Exit isolated mode' : 'Isolate this company profile'}
                    >
                      {isIsolated ? 'Isolated' : 'Isolate'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Calendars (India Holidays) */}
        <div className="border-t border-neutral-800/80 pt-3 text-xs space-y-2">
          <div className="font-semibold text-neutral-400 text-xs">Other calendars</div>
          <div className="flex items-center gap-2 text-neutral-300">
            <div className="w-4 h-4 rounded-xs bg-indigo-500/80 border border-indigo-400 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
            <span className="text-xs">Holidays in India</span>
          </div>
        </div>

        {/* Sync Feed Quick Action */}
        <div className="border-t border-neutral-800/80 pt-3 text-[11px] text-neutral-400">
          <div className="flex items-center justify-between">
            <span>GMT+05:30 (India)</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Synced
            </span>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CALENDAR VIEWPORT (4-Day Schedule Grid)             */}
      {/* ======================================================== */}
      <div className="flex-1 w-full space-y-3 min-w-0">
        {/* Top Calendar Toolbar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          {/* Left: Today, Prev, Next, Month Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentDate(new Date('2026-09-05'))}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Today
            </button>

            <div className="flex items-center gap-1 text-neutral-400">
              <button
                onClick={() => setCurrentDate(new Date('2026-09-01'))}
                className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date('2026-09-09'))}
                className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-neutral-100 font-mono tracking-tight">
              September 2026
            </h2>

            <span className="text-xs text-neutral-500 hidden sm:inline font-mono">
              · {filteredMeetings.length} meetings active
            </span>
          </div>

          {/* Right: Client Tier Quick Filter, View Switcher & Export */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Tier Filter */}
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg">
              <span className="text-[11px] text-neutral-500 px-1.5">Tier:</span>
              {(['ALL', 'A', 'B', 'C'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                    selectedTier === tier
                      ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tier === 'ALL' ? 'All' : `Tier ${tier}`}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('4day')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === '4day'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                4 Days (Sample)
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'agenda'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Agenda
              </button>
            </div>

            {/* Export .ics */}
            <button
              onClick={handleExportIcs}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export RFC 5545 iCalendar feed"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              <span>Export .ics</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW MODE 1: 4-DAY HOURLY GRID (Exact Google Cal Sample) */}
        {/* ======================================================== */}
        {viewMode === '4day' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
            {/* Header: GMT Timezone & 4 Day Columns (Sat 5, Sun 6, Mon 7, Tue 8) */}
            <div className="grid grid-cols-[70px_repeat(4,1fr)] border-b border-neutral-800 bg-neutral-950/80 text-xs text-neutral-300">
              <div className="p-2.5 border-r border-neutral-800 text-[10px] text-neutral-500 font-mono flex items-center justify-center">
                GMT+05:30
              </div>

              {sampleFourDays.map((d) => (
                <div
                  key={d.dateString}
                  className="p-3 border-r border-neutral-800 last:border-r-0 text-center flex flex-col items-center justify-center"
                >
                  <span className="text-[11px] font-medium text-neutral-400 tracking-wider">
                    {d.dayName}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold mt-0.5 ${
                      d.isToday
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                        : 'text-neutral-200'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </div>
              ))}
            </div>

            {/* All-Day Banner row (matching "! SM" from screenshot) */}
            <div className="grid grid-cols-[70px_repeat(4,1fr)] border-b border-neutral-800/80 bg-neutral-950/40 text-xs">
              <div className="p-2 border-r border-neutral-800 text-[10px] text-neutral-500 text-right pr-2">
                All-day
              </div>
              <div className="p-1 col-span-4 flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5">
                  <span className="font-mono text-purple-400 font-bold">! SM</span>
                  <span className="text-[11px] text-neutral-300 font-normal">
                    (Executive Standup & Priorities)
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Hourly Matrix */}
            <div className="relative max-h-[720px] overflow-y-auto">
              <div className="grid grid-cols-[70px_repeat(4,1fr)] relative">
                {/* Time Axis Column */}
                <div className="border-r border-neutral-800 divide-y divide-neutral-800/60 bg-neutral-950/30">
                  {hours.map((h) => (
                    <div
                      key={h.hour24}
                      className="h-16 text-[11px] text-neutral-500 font-mono pr-2.5 pt-1 text-right tabular-nums select-none"
                    >
                      {h.label}
                    </div>
                  ))}
                </div>

                {/* 4 Day Columns */}
                {sampleFourDays.map((dayCol, colIndex) => {
                  const dayEvents = getMeetingsForDay(dayCol.dateString);

                  return (
                    <div
                      key={dayCol.dateString}
                      className="relative border-r border-neutral-800 last:border-r-0 divide-y divide-neutral-800/40 bg-neutral-900/40"
                    >
                      {/* Grid background hour rows */}
                      {hours.map((h) => (
                        <div
                          key={h.hour24}
                          onClick={() =>
                            onOpenNewMeeting(
                              `${dayCol.dateString}`
                            )
                          }
                          className="h-16 hover:bg-neutral-850/40 transition-colors cursor-pointer"
                        />
                      ))}

                      {/* Current Time Red Indicator Line (at ~8:20 PM on Saturday 5!) */}
                      {dayCol.isToday && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{
                            // 8:20 PM is (20 - 9) * 60 + 20 = 680 minutes from 9 AM.
                            // 680 / 60 * 64px = ~725px
                            top: `${(680 / 60) * 64}px`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                          <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                      )}

                      {/* Render Scheduled Meeting Event Cards on this day column */}
                      {dayEvents.map((m) => {
                        const comp = companyMap.get(m.companyId);
                        const cli = clientMap.get(m.clientId);
                        const pos = getEventPositionStyle(m.startTime, m.endTime);

                        // Highlight prominent purple cards like in screenshot
                        const isProminentPurple =
                          m.companyId === 'cal-mandar' ||
                          m.companyId === 'cal-rajadhyaksha' ||
                          m.companyId === 'cal-sm';

                        return (
                          <div
                            key={m.id}
                            onClick={() => onOpenMeeting(m.id)}
                            style={{
                              top: pos.top,
                              height: pos.height,
                            }}
                            className={`absolute left-1 right-1 z-10 p-1.5 rounded border text-xs cursor-pointer overflow-hidden transition-all shadow-xs hover:z-30 hover:ring-1 hover:ring-white/40 ${
                              isProminentPurple
                                ? 'bg-purple-900/70 border-purple-500/50 text-purple-100 hover:bg-purple-800/80'
                                : 'bg-neutral-950/90 border-neutral-700/80 text-neutral-100 hover:bg-neutral-850'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 leading-tight">
                              <span className="font-semibold truncate text-[11px]">
                                {m.title}
                              </span>
                              {cli?.tier && (
                                <span className="text-[9px] font-mono px-1 rounded bg-black/40 text-neutral-300 shrink-0 font-bold">
                                  T{cli.tier}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-neutral-300 font-mono mt-0.5 truncate tabular-nums">
                              {formatTimeRange(m.startTime, m.endTime)}
                            </div>

                            {/* Location preview if space allows */}
                            {parseInt(pos.height) > 45 && (
                              <div className="text-[10px] text-neutral-400 truncate mt-1">
                                {m.location}
                              </div>
                            )}

                            {/* Notes status chips */}
                            {parseInt(pos.height) > 60 && (
                              <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                                {m.notes.preMeeting.sentToAttendees && (
                                  <span className="text-emerald-300 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Brief
                                  </span>
                                )}
                                {m.notes.postMeeting.syncedToAccount && (
                                  <span className="text-indigo-300 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 2: MONTH VIEW GRID                             */}
        {/* ======================================================== */}
        {viewMode === 'month' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-950 text-xs font-semibold text-neutral-400 text-center py-2.5">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-neutral-800/80 bg-neutral-900">
              {calendarDays.map((cell, index) => {
                const dayMeetings = getMeetingsForDay(cell.dateString);
                const isSelectedDay = cell.dayNumber >= 5 && cell.dayNumber <= 8 && cell.isCurrentMonth;
                const isToday = cell.dayNumber === 5 && cell.isCurrentMonth;

                return (
                  <div
                    key={index}
                    className={`min-h-[115px] p-1.5 flex flex-col justify-between transition-colors group relative ${
                      cell.isCurrentMonth ? 'bg-neutral-900/60' : 'bg-neutral-950/40 opacity-40'
                    } ${isToday ? 'ring-1 ring-blue-500 bg-blue-950/10' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-600 text-white font-bold'
                            : isSelectedDay
                            ? 'bg-blue-950/80 text-blue-300 font-semibold'
                            : 'text-neutral-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      <button
                        onClick={() => onOpenNewMeeting(cell.dateString)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {dayMeetings.slice(0, 3).map((m) => {
                        const comp = companyMap.get(m.companyId);
                        return (
                          <div
                            key={m.id}
                            onClick={() => onOpenMeeting(m.id)}
                            className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-[10px] truncate cursor-pointer flex items-center gap-1.5"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: comp?.accentHex || '#6366F1' }}
                            />
                            <span className="truncate text-neutral-200">{m.title}</span>
                          </div>
                        );
                      })}
                      {dayMeetings.length > 3 && (
                        <div className="text-[10px] text-neutral-500 text-center font-mono">
                          +{dayMeetings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW MODE 3: AGENDA / MASTER STREAM                      */}
        {/* ======================================================== */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {filteredMeetings.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="font-semibold text-neutral-300">No scheduled meetings found</p>
                <p className="mt-1 text-neutral-500">
                  Ensure calendar checkboxes are selected in the left sidebar.
                </p>
              </div>
            ) : (
              filteredMeetings.map((meeting) => {
                const comp = companyMap.get(meeting.companyId);
                const cli = clientMap.get(meeting.clientId);

                return (
                  <div
                    key={meeting.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: comp?.accentHex || '#6366F1' }}
                          />
                          {comp?.name}
                        </span>
                        <span>·</span>
                        <span className="text-neutral-200 font-semibold">{cli?.name}</span>
                        {cli?.tier && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            Tier {cli.tier}
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-neutral-400 text-[11px] font-mono">
                          {meeting.meetingType}
                        </span>
                      </div>

                      <h3
                        onClick={() => onOpenMeeting(meeting.id)}
                        className="text-sm font-bold text-neutral-100 hover:text-indigo-400 cursor-pointer transition-colors"
                      >
                        {meeting.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono tabular-nums">
                        <span className="text-neutral-300">{formatDateLabel(meeting.startTime)}</span>
                        <span>·</span>
                        <span className="text-neutral-300">{formatTimeRange(meeting.startTime, meeting.endTime)}</span>
                        <span>·</span>
                        <span className="text-neutral-400 truncate max-w-sm font-sans">
                          {meeting.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenMeeting(meeting.id)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        Meeting Notes & Actions
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
