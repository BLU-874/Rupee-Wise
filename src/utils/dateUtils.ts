/**
 * RupeeWise Date Utilities
 * 
 * Strict local calendar date math to avoid UTC offset and timezone shifting bugs.
 * Handles dynamic 30-day challenge tracking, calendar month grids, and date formatting.
 */

/**
 * Returns today's date in local calendar 'YYYY-MM-DD' format.
 */
export function getTodayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object (year, monthIndex, day).
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] ? parts[1] - 1 : 0;
  const day = parts[2] || 1;
  return new Date(year, month, day);
}

/**
 * Formats a 'YYYY-MM-DD' string into an ISO string.
 */
export function toLocalISOString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the difference in calendar days between two 'YYYY-MM-DD' strings.
 * If toStr is after fromStr, returns positive number.
 */
export function diffInCalendarDays(fromStr: string, toStr: string): number {
  const from = parseLocalDate(fromStr);
  const to = parseLocalDate(toStr);
  const msDiff = to.getTime() - from.getTime();
  return Math.round(msDiff / (1000 * 60 * 60 * 24));
}

/**
 * Adds (or subtracts) calendar days to a 'YYYY-MM-DD' string.
 */
export function addCalendarDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalISOString(d);
}

/**
 * Formats a 'YYYY-MM-DD' string into a friendly localized string.
 * Example: '11 Oct 2026' or 'Monday, 11 Oct'
 */
export function formatFriendlyDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("en-IN", options);
}

export interface DynamicChallengeState {
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
  daysRemaining: number;
  timeProgressPercent: number;
  isCompleted: boolean;
  isBeforeStart: boolean;
  status: "active" | "completed" | "upcoming";
  today: string;
}

/**
 * Derives dynamic 30-day challenge progress from stored start date and current local date.
 * - Start date is Day 1.
 * - End date is Day 30 (startDate + 29 days).
 * - On Day 1: 30 days remain (including today).
 * - On Day 30: 1 day remains.
 * - When period ends (> 30 days): 0 days remain, marked 'completed'.
 */
export function calculateChallengeProgress(
  periodStart: string,
  totalDays = 30,
  todayStr?: string
): DynamicChallengeState {
  const today = todayStr || getTodayLocalISO();
  const diffDays = diffInCalendarDays(periodStart, today);

  const rawDay = diffDays + 1;
  const isBeforeStart = rawDay < 1;
  const isCompleted = rawDay > totalDays;

  const currentDay = Math.max(1, Math.min(totalDays, rawDay));

  let daysRemaining = 0;
  if (!isCompleted && !isBeforeStart) {
    daysRemaining = Math.max(0, totalDays - diffDays);
  } else if (isBeforeStart) {
    daysRemaining = totalDays;
  }

  const endDate = addCalendarDays(periodStart, totalDays - 1);
  const timeProgressPercent = isCompleted
    ? 100
    : isBeforeStart
    ? 0
    : Math.min(100, Math.max(0, Math.round(((currentDay - 1) / totalDays) * 100)));

  const status: "active" | "completed" | "upcoming" = isCompleted
    ? "completed"
    : isBeforeStart
    ? "upcoming"
    : "active";

  return {
    startDate: periodStart,
    endDate,
    currentDay,
    totalDays,
    daysRemaining,
    timeProgressPercent,
    isCompleted,
    isBeforeStart,
    status,
    today,
  };
}

/**
 * Checks whether a given 'YYYY-MM-DD' falls within the challenge period [startDate, endDate].
 */
export function isDateWithinChallenge(
  dateStr: string,
  startDate: string,
  totalDays = 30
): boolean {
  const endDate = addCalendarDays(startDate, totalDays - 1);
  return dateStr >= startDate && dateStr <= endDate;
}

export interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWithinChallenge: boolean;
  isChallengeStart: boolean;
  isChallengeEnd: boolean;
}

/**
 * Generates month grid cells for a given year & month (0-indexed, 0=Jan)
 * with Monday as first day of week.
 */
export function generateMonthGrid(
  year: number,
  monthIndex: number,
  challengeStart: string,
  totalDays = 30
): CalendarDayCell[] {
  const today = getTodayLocalISO();
  const challengeEnd = addCalendarDays(challengeStart, totalDays - 1);

  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  // Monday = 1, Sunday = 0 in JS. We want Monday=0 .. Sunday=6
  let firstDayOfWeek = firstOfMonth.getDay() - 1;
  if (firstDayOfWeek === -1) firstDayOfWeek = 6;

  const cells: CalendarDayCell[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevDate = new Date(year, monthIndex - 1, day);
    const dateStr = toLocalISOString(prevDate);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isWithinChallenge: dateStr >= challengeStart && dateStr <= challengeEnd,
      isChallengeStart: dateStr === challengeStart,
      isChallengeEnd: dateStr === challengeEnd,
    });
  }

  // Current month days
  for (let day = 1; day <= lastOfMonth.getDate(); day++) {
    const curDate = new Date(year, monthIndex, day);
    const dateStr = toLocalISOString(curDate);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isWithinChallenge: dateStr >= challengeStart && dateStr <= challengeEnd,
      isChallengeStart: dateStr === challengeStart,
      isChallengeEnd: dateStr === challengeEnd,
    });
  }

  // Next month leading days to complete grid rows of 7
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, monthIndex + 1, day);
    const dateStr = toLocalISOString(nextDate);
    cells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateStr === today,
      isWithinChallenge: dateStr >= challengeStart && dateStr <= challengeEnd,
      isChallengeStart: dateStr === challengeStart,
      isChallengeEnd: dateStr === challengeEnd,
    });
  }

  return cells;
}
