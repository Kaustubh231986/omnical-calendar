import React, { useState, useMemo } from 'react';
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
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CURRENT_VIRTUAL_TIME,
  formatTimeRange,
  formatDateLabel,
  formatDateIso,
  formatMonthYear,
  isSameDay,
  getDaysWindow,
  getMonthMatrix,
  generateMasterIcs,
  triggerFileDownload,
  DayColumnInfo,
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
  } = useApp();

  // Navigation states: default to current date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'4day' | 'week' | 'month' | 'agenda'>('4day');
  const [myCalendarsExpanded, setMyCalendarsExpanded] = useState(true);

  // Company and client lookup maps
  const companyMap = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const clientMap = useMemo(() => new Map(clients.map((cl) => [cl.id, cl])), [clients]);

  // Export iCalendar .ics file
  const handleExportIcs = () => {
    const icsContent = generateMasterIcs(filteredMeetings, currentCompany || undefined);
    const filename = currentCompany
      ? `${currentCompany.slug}-calendar.ics`
      : 'unified-master-schedule.ics';
    triggerFileDownload(icsContent, filename, 'text/calendar');
  };

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

  // Helper to calculate top position and height in px for hourly grid
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
    return filteredMeetings.filter((m) => m.startTime.slice(0, 10) === dateString);
  };

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === '4day') {
        next.setDate(prev.getDate() - 4);
      } else if (viewMode === 'week') {
        next.setDate(prev.getDate() - 7);
      } else if (viewMode === 'month') {
        next.setMonth(prev.getMonth() - 1);
      } else {
        next.setDate(prev.getDate() - 7);
      }
      setMiniCalendarMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === '4day') {
        next.setDate(prev.getDate() + 4);
      } else if (viewMode === 'week') {
        next.setDate(prev.getDate() + 7);
      } else if (viewMode === 'month') {
        next.setMonth(prev.getMonth() + 1);
      } else {
        next.setDate(prev.getDate() + 7);
      }
      setMiniCalendarMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return next;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleJumpToSampleSept2026 = () => {
    const sample = new Date('2026-09-05T00:00:00');
    setCurrentDate(sample);
    setMiniCalendarMonth(new Date(2026, 8, 1));
  };

  const handleMiniPrev = () => {
    setMiniCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleMiniNext = () => {
    setMiniCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Dynamic Day columns for 4-day and Week view
  const activeColumns: DayColumnInfo[] = useMemo(() => {
    if (viewMode === 'week') {
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay(); // 0 is Sunday
      d.setDate(d.getDate() - dayOfWeek);
      return getDaysWindow(d, 7);
    }
    // 4-day view starts from currentDate
    return getDaysWindow(currentDate, 4);
  }, [currentDate, viewMode]);

  // Dynamic Month Matrix for Month View
  const monthMatrix = useMemo(() => {
    return getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  // Mini Calendar Matrix
  const miniCalendarDays = useMemo(() => {
    return getMonthMatrix(miniCalendarMonth.getFullYear(), miniCalendarMonth.getMonth());
  }, [miniCalendarMonth]);

  // Current red line position calculation
  const now = new Date();
  const nowMinutesFrom9 = (now.getHours() - 9) * 60 + now.getMinutes();
  const currentRedLineTop = (nowMinutesFrom9 / 60) * 64;
  const isNowWithinGridHours = now.getHours() >= 9 && now.getHours() <= 23;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* ======================================================== */}
      {/* GOOGLE CALENDAR LEFT SIDEBAR: "My calendars" (Profiles)  */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-72 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shrink-0 shadow-xs space-y-4">
        {/* + Create Button */}
        <button
          onClick={() => onOpenNewMeeting(formatDateIso(currentDate))}
          className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-2xl border border-neutral-700 font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-neutral-600"
        >
          <span className="text-base font-bold text-indigo-400">+</span>
          <span className="font-semibold text-sm">Create</span>
        </button>

        {/* Mini Calendar Header / Dynamic Navigation */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-neutral-200">
              {formatMonthYear(miniCalendarMonth)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMiniPrev}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMiniNext}
                className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] text-neutral-500 font-medium py-1">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] gap-y-1 font-mono">
            {miniCalendarDays.slice(0, 35).map((cd, i) => {
              const isSelectedDay = isSameDay(cd.fullDate, currentDate);
              const isToday = cd.isToday;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentDate(cd.fullDate);
                    setMiniCalendarMonth(new Date(cd.fullDate.getFullYear(), cd.fullDate.getMonth(), 1));
                  }}
                  className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isToday
                      ? 'bg-blue-600 text-white font-bold ring-1 ring-blue-400'
                      : isSelectedDay
                      ? 'bg-indigo-600/80 text-white font-semibold'
                      : cd.isCurrentMonth
                      ? 'text-neutral-300 hover:bg-neutral-800'
                      : 'text-neutral-600'
                  }`}
                  title={cd.dateString}
                >
                  {cd.dayNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick jump to Sample vs Today */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleGoToToday}
            className="flex-1 py-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[11px] font-medium border border-neutral-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Jump to current date (November 2026)"
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            Today
          </button>
          <button
            onClick={handleJumpToSampleSept2026}
            className="flex-1 py-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-[11px] font-medium border border-neutral-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Jump back to September 2026 demo sample"
          >
            <RotateCcw className="w-3 h-3 text-purple-400" />
            Sept Demo
          </button>
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
              Live Sync
            </span>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CALENDAR VIEWPORT                                   */}
      {/* ======================================================== */}
      <div className="flex-1 w-full space-y-3 min-w-0">
        {/* Top Calendar Toolbar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          {/* Left: Today, Prev, Next, Month Title, Direct Date Jump */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Jump to current real date"
            >
              Today
            </button>

            <button
              onClick={handleJumpToSampleSept2026}
              className="px-2.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-100 rounded-lg border border-purple-700/50 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Jump back to September 2026 demo schedule"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Sept Sample</span>
            </button>

            <div className="flex items-center gap-1 text-neutral-400">
              <button
                onClick={handlePrevious}
                className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors cursor-pointer"
                title="Previous dates"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-neutral-800 rounded-lg hover:text-white transition-colors cursor-pointer"
                title="Next dates"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Month & Year */}
            <h2 className="text-base font-bold text-neutral-100 font-mono tracking-tight">
              {formatMonthYear(currentDate)}
            </h2>

            {/* Direct Date Picker Jump */}
            <input
              type="date"
              value={formatDateIso(currentDate)}
              onChange={(e) => {
                if (e.target.value) {
                  const d = new Date(e.target.value + 'T00:00:00');
                  setCurrentDate(d);
                  setMiniCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-mono text-neutral-300 hover:border-neutral-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              title="Choose any date directly"
            />

            <span className="text-xs text-neutral-500 hidden xl:inline font-mono">
              · {filteredMeetings.length} meetings loaded
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
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    selectedTier === tier
                      ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tier === 'ALL' ? 'All' : `Tier ${tier}`}
                </button>
              ))}
            </div>

            {/* View Mode Switcher: 4-Day, Week, Month, Agenda */}
            <div className="flex items-center gap-0.5 bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('4day')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === '4day'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                4 Days
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
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
              <span>.ics</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW MODE 1 & 2: 4-DAY / WEEK HOURLY MATRIX             */}
        {/* ======================================================== */}
        {(viewMode === '4day' || viewMode === 'week') && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xs">
            {/* Header: GMT Timezone & Dynamic Day Columns */}
            <div
              className="grid border-b border-neutral-800 bg-neutral-950/80 text-xs text-neutral-300"
              style={{
                gridTemplateColumns: `70px repeat(${activeColumns.length}, 1fr)`,
              }}
            >
              <div className="p-2.5 border-r border-neutral-800 text-[10px] text-neutral-500 font-mono flex items-center justify-center">
                GMT+05:30
              </div>

              {activeColumns.map((d) => (
                <div
                  key={d.dateString}
                  className="p-3 border-r border-neutral-800 last:border-r-0 text-center flex flex-col items-center justify-center transition-colors hover:bg-neutral-900/60"
                >
                  <span className="text-[11px] font-medium text-neutral-400 tracking-wider">
                    {d.dayName}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold mt-0.5 ${
                      d.isToday
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                        : isSameDay(d.fullDate, currentDate)
                        ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-500/40'
                        : 'text-neutral-200'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </div>
              ))}
            </div>

            {/* All-Day Banner row (Standup priority banner) */}
            <div
              className="grid border-b border-neutral-800/80 bg-neutral-950/40 text-xs"
              style={{
                gridTemplateColumns: `70px repeat(${activeColumns.length}, 1fr)`,
              }}
            >
              <div className="p-2 border-r border-neutral-800 text-[10px] text-neutral-500 text-right pr-2">
                All-day
              </div>
              <div
                className="p-1 flex items-center gap-2"
                style={{ gridColumn: `span ${activeColumns.length}` }}
              >
                <div className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5">
                  <span className="font-mono text-purple-400 font-bold">! SM</span>
                  <span className="text-[11px] text-neutral-300 font-normal">
                    (Executive Standup & Unified Master Priorities)
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Hourly Matrix */}
            <div className="relative max-h-[720px] overflow-y-auto">
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: `70px repeat(${activeColumns.length}, 1fr)`,
                }}
              >
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

                {/* Day Columns */}
                {activeColumns.map((dayCol) => {
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
                          onClick={() => onOpenNewMeeting(dayCol.dateString)}
                          className="h-16 hover:bg-neutral-850/40 transition-colors cursor-pointer"
                          title={`Schedule meeting on ${dayCol.dateString} at ${h.label}`}
                        />
                      ))}

                      {/* Current Time Red Indicator Line if this column is today */}
                      {dayCol.isToday && isNowWithinGridHours && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{
                            top: `${currentRedLineTop}px`,
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
        {/* VIEW MODE 3: MONTH VIEW GRID                             */}
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
              {monthMatrix.map((cell, index) => {
                const dayMeetings = getMeetingsForDay(cell.dateString);
                const isSelectedDay = isSameDay(cell.fullDate, currentDate);
                const isToday = cell.isToday;

                return (
                  <div
                    key={index}
                    className={`min-h-[115px] p-1.5 flex flex-col justify-between transition-colors group relative ${
                      cell.isCurrentMonth ? 'bg-neutral-900/60' : 'bg-neutral-950/40 opacity-40'
                    } ${isToday ? 'ring-1 ring-blue-500 bg-blue-950/10' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCurrentDate(cell.fullDate);
                          setViewMode('4day');
                        }}
                        className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center transition-colors cursor-pointer ${
                          isToday
                            ? 'bg-blue-600 text-white font-bold'
                            : isSelectedDay
                            ? 'bg-indigo-600 text-white font-semibold'
                            : cell.isCurrentMonth
                            ? 'text-neutral-300 hover:bg-neutral-800'
                            : 'text-neutral-500'
                        }`}
                        title="Click to view 4-day schedule starting here"
                      >
                        {cell.dayNumber}
                      </button>
                      <button
                        onClick={() => onOpenNewMeeting(cell.dateString)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white cursor-pointer"
                        title={`Schedule meeting on ${cell.dateString}`}
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
                            className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-[10px] truncate cursor-pointer flex items-center gap-1.5 transition-colors"
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
                        <div
                          onClick={() => {
                            setCurrentDate(cell.fullDate);
                            setViewMode('4day');
                          }}
                          className="text-[10px] text-neutral-400 hover:text-indigo-300 text-center font-mono cursor-pointer"
                        >
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
        {/* VIEW MODE 4: AGENDA / MASTER STREAM                      */}
        {/* ======================================================== */}
        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {filteredMeetings.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-400 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="font-semibold text-neutral-300">No scheduled meetings found</p>
                <p className="mt-1 text-neutral-500">
                  Ensure calendar checkboxes are selected in the left sidebar or change filters.
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
