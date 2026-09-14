import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AppEvent, AppTask } from '@/context/AppState';

const STORAGE_KEY = 'sharenote.scheduledReminderNotificationIds.v1';
const REMINDER_CHANNEL_ID = 'sharenote-reminders';
const MAX_SCHEDULED_NOTIFICATIONS = 64;
const MAX_OCCURRENCES_PER_ITEM = 32;

const REMINDER_OFFSETS_MINUTES: Record<string, number | null> = {
  None: null,
  'At time of event': 0,
  '5 minutes before': 5,
  '10 minutes before': 10,
  '15 minutes before': 15,
  '30 minutes before': 30,
  '1 hour before': 60,
  '1 day before': 24 * 60,
  '1 week before': 7 * 24 * 60,
};

type ReminderItem = (AppEvent | AppTask) & {
  kind: 'event' | 'task';
};

type StoredNotificationIds = Record<string, string[]>;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function parseCanonicalDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toCanonicalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const date = parseCanonicalDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toCanonicalDate(date);
}

function addMonthsClamped(value: string, months: number) {
  const date = parseCanonicalDate(value);
  if (!date) return value;
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  return toCanonicalDate(new Date(targetYear, targetMonth, Math.min(date.getDate(), daysInTargetMonth)));
}

function addYearsClamped(value: string, years: number) {
  const date = parseCanonicalDate(value);
  if (!date) return value;
  const daysInTargetMonth = new Date(date.getFullYear() + years, date.getMonth() + 1, 0).getDate();
  return toCanonicalDate(new Date(date.getFullYear() + years, date.getMonth(), Math.min(date.getDate(), daysInTargetMonth)));
}

function nextOccurrenceDate(item: ReminderItem, value: string) {
  const repeat = item.repeat ?? 'None';
  if (repeat === 'Daily') return addDays(value, 1);
  if (repeat === 'Weekly') return addDays(value, 7);
  if (repeat === 'Monthly') return addMonthsClamped(value, 1);
  if (repeat === 'Yearly') return addYearsClamped(value, 1);
  return value;
}

function compareDates(left: string, right: string) {
  const leftDate = parseCanonicalDate(left);
  const rightDate = parseCanonicalDate(right);
  if (!leftDate || !rightDate) return 0;
  return leftDate.getTime() - rightDate.getTime();
}

function getOccurrenceDates(item: ReminderItem) {
  const repeat = item.repeat ?? 'None';
  const dates: string[] = [];
  let currentDate = item.date;

  for (let index = 0; index < MAX_OCCURRENCES_PER_ITEM; index++) {
    if (item.repeatOccurrences && index >= item.repeatOccurrences) break;
    if (item.repeatEndsOn && compareDates(currentDate, item.repeatEndsOn) > 0) break;

    dates.push(currentDate);
    if (repeat === 'None') break;

    const nextDate = nextOccurrenceDate(item, currentDate);
    if (nextDate === currentDate) break;
    currentDate = nextDate;
  }

  return dates;
}

function parseStartDateTime(date: string, time: string) {
  if (!time || time === 'No time set') return null;

  const startTime = time.split(' - ')[0]?.trim();
  const match = startTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const startDate = parseCanonicalDate(date);
  if (!match || !startDate) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  startDate.setHours(hours, minutes, 0, 0);
  return startDate;
}

function getReminderOffsets(item: ReminderItem) {
  return [item.reminder, item.secondReminder]
    .map((reminder) => REMINDER_OFFSETS_MINUTES[reminder ?? 'None'])
    .filter((offset): offset is number => offset !== null && offset !== undefined)
    .filter((offset, index, offsets) => offsets.indexOf(offset) === index);
}

function formatReminderBody(offsetMinutes: number) {
  if (offsetMinutes === 0) return 'Starts now.';
  if (offsetMinutes < 60) return `Starts in ${offsetMinutes} minutes.`;
  if (offsetMinutes === 60) return 'Starts in 1 hour.';
  if (offsetMinutes === 24 * 60) return 'Starts tomorrow.';
  if (offsetMinutes === 7 * 24 * 60) return 'Starts in 1 week.';
  return 'Starts soon.';
}

async function readStoredNotificationIds(): Promise<StoredNotificationIds> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) return {};

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as StoredNotificationIds;
  } catch {
    return {};
  }
}

async function cancelStoredNotifications(storedIds: StoredNotificationIds) {
  const ids = Object.values(storedIds).flat();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function ensureNotificationPermissions() {
  const currentPermissions = await Notifications.getPermissionsAsync();
  if (currentPermissions.status === 'granted') return true;
  if (!currentPermissions.canAskAgain) return false;

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.status === 'granted';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function scheduleItemNotifications(item: ReminderItem, availableSlots: number) {
  const offsets = getReminderOffsets(item);
  if (offsets.length === 0 || availableSlots <= 0) return [];
  if ('done' in item && item.done) return [];

  const now = Date.now();
  const scheduledIds: string[] = [];

  for (const occurrenceDate of getOccurrenceDates(item)) {
    const startDateTime = parseStartDateTime(occurrenceDate, item.time);
    if (!startDateTime) continue;

    for (const offsetMinutes of offsets) {
      const triggerAt = new Date(startDateTime.getTime() - offsetMinutes * 60 * 1000);
      if (triggerAt.getTime() <= now) continue;
      if (scheduledIds.length >= availableSlots) return scheduledIds;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: item.kind === 'event' ? item.title : `Task: ${item.title}`,
          body: formatReminderBody(offsetMinutes),
          sound: 'default',
          data: {
            itemId: item.id,
            kind: item.kind,
            date: occurrenceDate,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerAt,
          channelId: REMINDER_CHANNEL_ID,
        },
      });

      scheduledIds.push(notificationId);
    }
  }

  return scheduledIds;
}

export async function syncReminderNotifications(events: AppEvent[], tasks: AppTask[]) {
  if (Platform.OS === 'web') return;

  const storedIds = await readStoredNotificationIds();
  await cancelStoredNotifications(storedIds);

  const items: ReminderItem[] = [
    ...events.map((event) => ({ ...event, kind: 'event' as const })),
    ...tasks.map((task) => ({ ...task, kind: 'task' as const })),
  ].filter((item) => item.reminder || item.secondReminder);

  if (items.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  const hasPermissions = await ensureNotificationPermissions();
  if (!hasPermissions) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  await ensureAndroidChannel();

  const nextStoredIds: StoredNotificationIds = {};
  let availableSlots = MAX_SCHEDULED_NOTIFICATIONS;

  for (const item of items) {
    if (availableSlots <= 0) break;
    const scheduledIds = await scheduleItemNotifications(item, availableSlots);
    if (scheduledIds.length > 0) {
      nextStoredIds[`${item.kind}:${item.id}`] = scheduledIds;
      availableSlots -= scheduledIds.length;
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextStoredIds));
}
