import type { RepeatOption } from '@/context/AppState';

type ScheduleItem = {
  date: string;
  endDate?: string;
  repeat?: RepeatOption;
  repeatEndsOn?: string;
  repeatOccurrences?: number;
};

export function toCanonicalDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTodayCanonicalDate() {
  const today = new Date();
  return toCanonicalDate(today.getFullYear(), today.getMonth(), today.getDate());
}

export function getStartOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function parseCanonicalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function addMonthsClamped(date: Date, months: number) {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), daysInTargetMonth));
}

function addYearsClamped(date: Date, years: number) {
  const targetYear = date.getFullYear() + years;
  const daysInTargetMonth = new Date(targetYear, date.getMonth() + 1, 0).getDate();
  return new Date(targetYear, date.getMonth(), Math.min(date.getDate(), daysInTargetMonth));
}

function selectedIsInsideOccurrence(selected: Date, occurrenceStart: Date, durationDays: number) {
  const offset = daysBetween(occurrenceStart, selected);
  return offset >= 0 && offset <= durationDays;
}

function occursEveryDays(start: Date, selected: Date, durationDays: number, intervalDays: number, occurrences?: number) {
  const dayDelta = daysBetween(start, selected);
  const firstPossibleIndex = Math.max(0, Math.ceil((dayDelta - durationDays) / intervalDays));
  const lastPossibleIndex = Math.floor(dayDelta / intervalDays);

  for (let index = firstPossibleIndex; index <= lastPossibleIndex; index += 1) {
    if (occurrences && index >= occurrences) return false;
    const occurrenceStart = new Date(start);
    occurrenceStart.setDate(occurrenceStart.getDate() + index * intervalDays);
    if (selectedIsInsideOccurrence(selected, occurrenceStart, durationDays)) return true;
  }
  return false;
}

function occursMonthly(start: Date, selected: Date, durationDays: number, occurrences?: number) {
  const monthDelta =
    (selected.getFullYear() - start.getFullYear()) * 12 +
    selected.getMonth() -
    start.getMonth();
  if (monthDelta < 0) return false;
  const lastPossibleIndex = occurrences ? Math.min(monthDelta, occurrences - 1) : monthDelta;
  for (let index = 0; index <= lastPossibleIndex; index += 1) {
    if (selectedIsInsideOccurrence(selected, addMonthsClamped(start, index), durationDays)) return true;
  }
  return false;
}

function occursYearly(start: Date, selected: Date, durationDays: number, occurrences?: number) {
  const yearDelta = selected.getFullYear() - start.getFullYear();
  if (yearDelta < 0) return false;
  const lastPossibleIndex = occurrences ? Math.min(yearDelta, occurrences - 1) : yearDelta;
  for (let index = 0; index <= lastPossibleIndex; index += 1) {
    if (selectedIsInsideOccurrence(selected, addYearsClamped(start, index), durationDays)) return true;
  }
  return false;
}

export function itemOccursOn(item: ScheduleItem, selectedDate: string) {
  const start = parseCanonicalDate(item.date);
  const end = parseCanonicalDate(item.endDate || item.date);
  const selected = parseCanonicalDate(selectedDate);
  const repeat = item.repeat ?? 'None';
  const durationDays = Math.max(0, daysBetween(start, end));
  const dayDelta = daysBetween(start, selected);

  if (repeat === 'None') return dayDelta >= 0 && dayDelta <= durationDays;
  if (dayDelta < 0) return false;
  if (item.repeatEndsOn && daysBetween(parseCanonicalDate(item.repeatEndsOn), selected) > 0) return false;
  if (repeat === 'Daily') return occursEveryDays(start, selected, durationDays, 1, item.repeatOccurrences);
  if (repeat === 'Weekly') return occursEveryDays(start, selected, durationDays, 7, item.repeatOccurrences);
  if (repeat === 'Monthly') return occursMonthly(start, selected, durationDays, item.repeatOccurrences);
  if (repeat === 'Yearly') return occursYearly(start, selected, durationDays, item.repeatOccurrences);
  return false;
}
