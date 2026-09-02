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

function occursMonthly(start: Date, selected: Date, durationDays: number) {
  const monthDelta =
    (selected.getFullYear() - start.getFullYear()) * 12 +
    selected.getMonth() -
    start.getMonth();
  if (monthDelta < 0) return false;
  return [monthDelta - 1, monthDelta].some((delta) => (
    delta >= 0 && selectedIsInsideOccurrence(selected, addMonthsClamped(start, delta), durationDays)
  ));
}

function occursYearly(start: Date, selected: Date, durationDays: number) {
  const yearDelta = selected.getFullYear() - start.getFullYear();
  if (yearDelta < 0) return false;
  return [yearDelta - 1, yearDelta].some((delta) => (
    delta >= 0 && selectedIsInsideOccurrence(selected, addYearsClamped(start, delta), durationDays)
  ));
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
  if (repeat === 'Daily') return true;
  if (repeat === 'Weekly') {
    const occurrenceIndex = Math.floor(dayDelta / 7);
    if (item.repeatOccurrences && occurrenceIndex >= item.repeatOccurrences) return false;
    return dayDelta % 7 <= durationDays;
  }
  if (repeat === 'Monthly') return occursMonthly(start, selected, durationDays);
  if (repeat === 'Yearly') return occursYearly(start, selected, durationDays);
  return false;
}
