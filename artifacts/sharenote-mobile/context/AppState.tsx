import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  clearStoredActiveProfileId,
  clearStoredFamilyEmail,
  getStoredActiveProfileId,
  getStoredFamilyEmail,
  normalizeFamilyEmail,
  storeActiveProfileId,
  storeFamilyEmail,
} from '@/utils/deviceProfileStorage';
import { syncReminderNotifications } from '@/utils/reminderNotifications';
import { profileCanManage } from '@/utils/profilePermissions';
import { parseCanonicalDate, toCanonicalDate } from '@/utils/schedule';

export type FamilyMember = {
  id: string;
  name: string;
  nickname: string;
  role: string;
  initials: string;
  color: string;
};

export type AppEvent = {
  id: string;
  title: string;
  time: string;
  date: string;
  endDate?: string;
  repeat?: RepeatOption;
  repeatEndsOn?: string;
  repeatOccurrences?: number;
  personId: string;
  personIds?: string[];
  color: string;
  details?: string;
  reminder?: string;
  secondReminder?: string;
};

export type RepeatOption = 'None' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export type AppTask = {
  id: string;
  title: string;
  time: string;
  date: string;
  endDate?: string;
  repeat?: RepeatOption;
  repeatEndsOn?: string;
  repeatOccurrences?: number;
  location: string;
  personId: string;
  personIds?: string[];
  done: boolean;
  color: string;
  details?: string;
  reminder?: string;
  secondReminder?: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  details?: string;
  category: string;
  checked: boolean;
  personId?: string;
  displayOnDashboard?: boolean;
};

type AppStateContextType = {
  authUser: User | null;
  isAuthLoading: boolean;
  isFamilyStateLoading: boolean;
  familyEmail: string;
  familyName: string;
  activeProfileId: string | null;
  activeProfile: FamilyMember | null;
  canManageFamily: boolean;
  members: FamilyMember[];
  dashboardMembers: FamilyMember[];
  events: AppEvent[];
  dashboardEvents: AppEvent[];
  tasks: AppTask[];
  profileTasks: AppTask[];
  groceries: GroceryItem[];
  setFamilyName: (familyName: string) => void;
  setMembers: (members: FamilyMember[]) => void;
  signInFamily: (familyEmail: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (familyEmail: string) => Promise<AuthActionResult>;
  selectActiveProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
  addMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateMember: (id: string, member: Omit<FamilyMember, 'id'>) => void;
  deleteMember: (id: string) => void;
  createFamily: (
    familyName: string,
    yourName: string,
    familyEmail: string,
    password: string,
  ) => Promise<AuthActionResult>;
  addEvent: (event: Omit<AppEvent, 'id'>) => void;
  updateEvent: (id: string, event: Omit<AppEvent, 'id'>) => void;
  updateRecurringEventOccurrence: (id: string, occurrenceDate: string, event: Omit<AppEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;
  addTask: (task: Omit<AppTask, 'id' | 'done'>) => void;
  updateTask: (id: string, task: Omit<AppTask, 'id'>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'checked'>) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
};

const AppStateContext = createContext<AppStateContextType | null>(null);

type AuthActionResult = {
  ok: boolean;
  message?: string;
  needsEmailConfirmation?: boolean;
};

type PersistedAppState = {
  familyName: string;
  members: FamilyMember[];
  dashboardMembers: FamilyMember[];
  events: AppEvent[];
  dashboardEvents: AppEvent[];
  tasks: AppTask[];
  profileTasks: AppTask[];
  groceries: GroceryItem[];
};

const INITIAL_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'David Smith', nickname: 'Dad', role: 'Parent', initials: 'DS', color: '#9b5cf6' },
  { id: 'm2', name: 'Maya Smith', nickname: 'Mom', role: 'Parent', initials: 'MS', color: '#f6a53a' },
  { id: 'm3', name: 'Leo Smith', nickname: 'Jake', role: 'Child', initials: 'LS', color: '#12c7a0' },
];

const INITIAL_DASHBOARD_MEMBERS: FamilyMember[] = [
  ...INITIAL_MEMBERS,
  { id: 'm4', name: 'Lily Smith', nickname: 'Lily', role: 'Child', initials: 'LY', color: '#f04e9b' },
];

const INITIAL_EVENTS: AppEvent[] = [
  { id: 'e1', title: 'Dentist Appointment', time: '10:00 AM', date: '2025-08-12', personId: 'm2', color: '#5bb6ff' },
  { id: 'e2', title: 'Baseball Practice', time: '4:30 PM - 6:00 PM', date: '2025-08-12', personId: 'm3', color: '#12c7a0' },
  { id: 'e3', title: 'Family Dinner', time: '7:00 PM', date: '2025-08-12', personId: 'm1', color: '#9b5cf6' },
];

const INITIAL_DASHBOARD_EVENTS: AppEvent[] = [
  { id: 'e2', title: 'Baseball Practice', time: '4:30 PM - 6:00 PM', date: '2025-08-12', personId: 'm3', color: '#12c7a0' },
  { id: 'e4', title: 'Piano Lesson', time: '6:00 PM - 7:00 PM', date: '2025-08-12', personId: 'm4', color: '#f04e9b' },
];

const INITIAL_TASKS: AppTask[] = [
  { id: 't1', title: 'Take out garbage', time: '8:00 AM', date: '2025-08-12', location: 'Home', personId: 'm1', done: false, color: '#9b5cf6' },
  { id: 't2', title: 'Finish homework', time: '4:00 PM', date: '2025-08-12', location: 'School', personId: 'm3', done: false, color: '#12c7a0' },
  { id: 't3', title: 'Grocery shopping', time: '5:00 PM', date: '2025-08-12', location: 'Personal', personId: 'm2', done: false, color: '#f6a53a' },
];

const INITIAL_PROFILE_TASKS: AppTask[] = [
  { id: 't4', title: 'Buy Groceries', time: '', date: '2025-08-12', location: 'Weekly Shop', personId: 'm1', done: false, color: '#9b5cf6' },
  { id: 't5', title: 'Fix the sink', time: '', date: '2025-08-12', location: 'Kitchen', personId: 'm1', done: false, color: '#12c7a0' },
  { id: 't6', title: 'Pay bills', time: '', date: '2025-08-12', location: 'Due Today', personId: 'm1', done: false, color: '#5bb6ff' },
];

const INITIAL_GROCERIES: GroceryItem[] = [
  { id: 'g1', name: 'Apples (Honeycrisp)', category: 'Produce', checked: false, personId: 'm1' },
  { id: 'g2', name: 'Spinach', category: 'Produce', checked: false },
  { id: 'g3', name: 'Oat Milk', category: 'Dairy & Fridge', checked: false },
  { id: 'g4', name: 'Greek Yogurt (Vanilla)', category: 'Dairy & Fridge', checked: false },
  { id: 'g5', name: 'Milk', category: 'Dairy & Fridge', checked: true, displayOnDashboard: true },
  { id: 'g6', name: 'Eggs', category: 'Dairy & Fridge', checked: true, displayOnDashboard: true },
  { id: 'g7', name: 'Bread', category: 'Bakery', checked: true, displayOnDashboard: true },
];

const INITIAL_REMOTE_STATE: PersistedAppState = {
  familyName: 'Smith Family',
  members: INITIAL_MEMBERS,
  dashboardMembers: INITIAL_DASHBOARD_MEMBERS,
  events: INITIAL_EVENTS,
  dashboardEvents: INITIAL_DASHBOARD_EVENTS,
  tasks: INITIAL_TASKS,
  profileTasks: INITIAL_PROFILE_TASKS,
  groceries: INITIAL_GROCERIES,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function coercePersistedState(value: unknown): PersistedAppState | null {
  if (!isRecord(value)) return null;

  return {
    familyName: typeof value.familyName === 'string' ? value.familyName : INITIAL_REMOTE_STATE.familyName,
    members: Array.isArray(value.members) ? (value.members as FamilyMember[]) : INITIAL_REMOTE_STATE.members,
    dashboardMembers: Array.isArray(value.dashboardMembers)
      ? (value.dashboardMembers as FamilyMember[])
      : INITIAL_REMOTE_STATE.dashboardMembers,
    events: Array.isArray(value.events) ? (value.events as AppEvent[]) : INITIAL_REMOTE_STATE.events,
    dashboardEvents: Array.isArray(value.dashboardEvents)
      ? (value.dashboardEvents as AppEvent[])
      : INITIAL_REMOTE_STATE.dashboardEvents,
    tasks: Array.isArray(value.tasks) ? (value.tasks as AppTask[]) : INITIAL_REMOTE_STATE.tasks,
    profileTasks: Array.isArray(value.profileTasks)
      ? (value.profileTasks as AppTask[])
      : INITIAL_REMOTE_STATE.profileTasks,
    groceries: Array.isArray(value.groceries) ? (value.groceries as GroceryItem[]) : INITIAL_REMOTE_STATE.groceries,
  };
}

function createInitialFamilyState(familyName: string, yourName: string): PersistedAppState {
  const nameParts = yourName.split(/\s+/).filter(Boolean);
  const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME';
  const creator: FamilyMember = {
    id: `member-${Date.now()}`,
    name: yourName,
    nickname: nameParts[0] ?? yourName,
    role: 'Parent',
    initials,
    color: '#9b5cf6',
  };

  return {
    familyName,
    members: [creator],
    dashboardMembers: [creator],
    events: [],
    dashboardEvents: [],
    tasks: [],
    profileTasks: [],
    groceries: [],
  };
}

function createInitialFamilyStateForUser(user: User): PersistedAppState {
  const metadata = user.user_metadata;
  const familyName = typeof metadata.family_name === 'string' && metadata.family_name.trim()
    ? metadata.family_name.trim()
    : 'My Family';
  const fallbackName = user.email?.split('@')[0] ?? 'Me';
  const yourName = typeof metadata.display_name === 'string' && metadata.display_name.trim()
    ? metadata.display_name.trim()
    : fallbackName;

  return createInitialFamilyState(familyName, yourName);
}

function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function addDays(value: string, days: number) {
  const date = parseCanonicalDate(value);
  date.setDate(date.getDate() + days);
  return toCanonicalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonthsClamped(value: string, months: number) {
  const date = parseCanonicalDate(value);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDate = new Date(targetYear, targetMonth, Math.min(date.getDate(), daysInTargetMonth));
  return toCanonicalDate(clampedDate.getFullYear(), clampedDate.getMonth(), clampedDate.getDate());
}

function addYearsClamped(value: string, years: number) {
  const date = parseCanonicalDate(value);
  const targetYear = date.getFullYear() + years;
  const daysInTargetMonth = new Date(targetYear, date.getMonth() + 1, 0).getDate();
  const clampedDate = new Date(targetYear, date.getMonth(), Math.min(date.getDate(), daysInTargetMonth));
  return toCanonicalDate(clampedDate.getFullYear(), clampedDate.getMonth(), clampedDate.getDate());
}

function getOccurrenceStart(event: AppEvent, index: number) {
  const repeat = event.repeat ?? 'None';
  if (repeat === 'Daily') return addDays(event.date, index);
  if (repeat === 'Weekly') return addDays(event.date, index * 7);
  if (repeat === 'Monthly') return addMonthsClamped(event.date, index);
  if (repeat === 'Yearly') return addYearsClamped(event.date, index);
  return event.date;
}

function occurrenceIsAvailable(event: AppEvent, occurrenceStart: string, index: number) {
  if (event.repeatOccurrences && index >= event.repeatOccurrences) return false;
  if (event.repeatEndsOn && daysBetween(parseCanonicalDate(event.repeatEndsOn), parseCanonicalDate(occurrenceStart)) > 0) return false;
  return true;
}

function getOccurrenceInfo(event: AppEvent, selectedDate: string) {
  const repeat = event.repeat ?? 'None';
  const durationDays = Math.max(0, daysBetween(parseCanonicalDate(event.date), parseCanonicalDate(event.endDate || event.date)));
  const selected = parseCanonicalDate(selectedDate);
  let index = 0;

  while (index < 10000) {
    const occurrenceStart = getOccurrenceStart(event, index);
    if (!occurrenceIsAvailable(event, occurrenceStart, index)) return null;

    const start = parseCanonicalDate(occurrenceStart);
    const end = parseCanonicalDate(addDays(occurrenceStart, durationDays));
    if (daysBetween(start, selected) >= 0 && daysBetween(selected, end) >= 0) {
      return { index, occurrenceStart, durationDays };
    }
    if (daysBetween(selected, start) > 0 || repeat === 'None') return null;
    index += 1;
  }

  return null;
}

function moveEventDuration(event: AppEvent, startDate: string, durationDays: number): AppEvent {
  return {
    ...event,
    date: startDate,
    endDate: durationDays > 0 ? addDays(startDate, durationDays) : undefined,
  };
}

function createOneTimeEvent(event: Omit<AppEvent, 'id'>, id: string): AppEvent {
  return {
    ...event,
    id,
    repeat: 'None',
    repeatEndsOn: undefined,
    repeatOccurrences: undefined,
  };
}

function buildOccurrenceUpdateEvents(original: AppEvent, occurrenceDate: string, event: Omit<AppEvent, 'id'>, timestamp: number): AppEvent[] {
  const info = getOccurrenceInfo(original, occurrenceDate) ?? {
    index: 0,
    occurrenceStart: original.date,
    durationDays: Math.max(0, daysBetween(parseCanonicalDate(original.date), parseCanonicalDate(original.endDate || original.date))),
  };
  const replacement = createOneTimeEvent(event, `${original.id}-occurrence-${timestamp}`);
  const nextEvents: AppEvent[] = [];

  if (info.index > 0) {
    const previousOccurrenceStart = getOccurrenceStart(original, info.index - 1);
    nextEvents.push({
      ...original,
      repeatEndsOn: previousOccurrenceStart,
      repeatOccurrences: original.repeatOccurrences ? info.index : undefined,
    });
  }

  nextEvents.push(replacement);

  const nextOccurrenceIndex = info.index + 1;
  const nextOccurrenceStart = getOccurrenceStart(original, nextOccurrenceIndex);
  if (occurrenceIsAvailable(original, nextOccurrenceStart, nextOccurrenceIndex)) {
    nextEvents.push({
      ...moveEventDuration(original, nextOccurrenceStart, info.durationDays),
      id: `${original.id}-series-${timestamp}`,
      repeatOccurrences: original.repeatOccurrences ? original.repeatOccurrences - nextOccurrenceIndex : undefined,
    });
  }

  return nextEvents;
}

async function loadFamilyState(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('family_states')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return coercePersistedState((data as { state?: unknown } | null)?.state);
}

async function saveFamilyState(userId: string, familyEmail: string, state: PersistedAppState) {
  if (!supabase) return;

  const { error } = await supabase.from('family_states').upsert(
    {
      user_id: userId,
      family_email: familyEmail,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const storedFamilyEmail = getStoredFamilyEmail();
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [familyEmail, setFamilyEmail] = useState(storedFamilyEmail);
  const [familyName, setFamilyName] = useState('Smith Family');
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS);
  const [dashboardMembers, setDashboardMembers] = useState<FamilyMember[]>(INITIAL_DASHBOARD_MEMBERS);
  const [events, setEvents] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [dashboardEvents, setDashboardEvents] = useState<AppEvent[]>(INITIAL_DASHBOARD_EVENTS);
  const [tasks, setTasks] = useState<AppTask[]>(INITIAL_TASKS);
  const [profileTasks, setProfileTasks] = useState<AppTask[]>(INITIAL_PROFILE_TASKS);
  const [groceries, setGroceries] = useState<GroceryItem[]>(INITIAL_GROCERIES);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    getStoredActiveProfileId(storedFamilyEmail),
  );
  const [hasLoadedRemoteState, setHasLoadedRemoteState] = useState(
    !storedFamilyEmail || !isSupabaseConfigured,
  );
  const [canPersistRemoteState, setCanPersistRemoteState] = useState(isSupabaseConfigured);
  const skipNextRemoteLoadRef = useRef<string | null>(null);

  const allMembers = [
    ...members,
    ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id)),
  ];
  const activeProfile = allMembers.find((member) => member.id === activeProfileId) ?? null;
  const canManageFamily = profileCanManage(activeProfile);

  function applyPersistedState(nextState: PersistedAppState) {
    setFamilyName(nextState.familyName);
    setMembers(nextState.members);
    setDashboardMembers(nextState.dashboardMembers);
    setEvents(nextState.events);
    setDashboardEvents(nextState.dashboardEvents);
    setTasks(nextState.tasks);
    setProfileTasks(nextState.profileTasks);
    setGroceries(nextState.groceries);
  }

  function applySignedInSession(nextSession: Session | null) {
    const nextUser = nextSession?.user ?? null;
    const nextFamilyEmail = normalizeFamilyEmail(nextUser?.email ?? '');

    setAuthSession(nextSession);
    setAuthUser(nextUser);

    if (!nextUser || !nextFamilyEmail) {
      clearStoredActiveProfileId(familyEmail);
      clearStoredFamilyEmail();
      setFamilyEmail('');
      setActiveProfileId(null);
      applyPersistedState(INITIAL_REMOTE_STATE);
      setHasLoadedRemoteState(true);
      setCanPersistRemoteState(isSupabaseConfigured);
      return;
    }

    setFamilyEmail(nextFamilyEmail);
    setActiveProfileId(getStoredActiveProfileId(nextFamilyEmail));
    storeFamilyEmail(nextFamilyEmail);
  }

  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('Unable to read Supabase session.', error);
      }
      applySignedInSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      applySignedInSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = authUser?.id;

    if (!familyEmail || !isSupabaseConfigured || !userId) {
      setHasLoadedRemoteState(true);
      return;
    }

    if (skipNextRemoteLoadRef.current === userId) {
      skipNextRemoteLoadRef.current = null;
      setCanPersistRemoteState(true);
      setHasLoadedRemoteState(true);
      return;
    }

    let cancelled = false;

    setCanPersistRemoteState(true);
    setHasLoadedRemoteState(false);

    loadFamilyState(userId)
      .then((remoteState) => {
        if (cancelled) return;
        applyPersistedState(remoteState ?? createInitialFamilyStateForUser(authUser));
        setHasLoadedRemoteState(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('Unable to load family state from Supabase.', error);
        setCanPersistRemoteState(false);
        setHasLoadedRemoteState(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, familyEmail]);

  useEffect(() => {
    if (
      !authUser?.id
      || !familyEmail
      || !isSupabaseConfigured
      || !hasLoadedRemoteState
      || !canPersistRemoteState
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      saveFamilyState(authUser.id, familyEmail, {
        familyName,
        members,
        dashboardMembers,
        events,
        dashboardEvents,
        tasks,
        profileTasks,
        groceries,
      }).catch((error) => {
        console.warn('Unable to save family state to Supabase.', error);
        setCanPersistRemoteState(false);
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    canPersistRemoteState,
    dashboardEvents,
    dashboardMembers,
    events,
    authUser?.id,
    familyEmail,
    familyName,
    groceries,
    hasLoadedRemoteState,
    members,
    profileTasks,
    tasks,
  ]);

  useEffect(() => {
    if (!hasLoadedRemoteState) return;

    const uniqueEvents = [
      ...events,
      ...dashboardEvents.filter((event) => !events.some((item) => item.id === event.id)),
    ];
    const uniqueTasks = [
      ...tasks,
      ...profileTasks.filter((task) => !tasks.some((item) => item.id === task.id)),
    ];

    const timeout = setTimeout(() => {
      syncReminderNotifications(uniqueEvents, uniqueTasks).catch((error) => {
        console.warn('Unable to sync reminder notifications.', error);
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [dashboardEvents, events, hasLoadedRemoteState, profileTasks, tasks]);

  async function signInFamily(submittedFamilyEmail: string, password: string): Promise<AuthActionResult> {
    const normalizedFamilyEmail = normalizeFamilyEmail(submittedFamilyEmail);
    const normalizedPassword = password.trim();
    if (!normalizedFamilyEmail || !normalizedPassword) {
      return { ok: false, message: 'Enter your email and password.' };
    }

    if (!supabase) {
      const storedProfileId = getStoredActiveProfileId(normalizedFamilyEmail);
      setFamilyEmail(normalizedFamilyEmail);
      setActiveProfileId(storedProfileId);
      storeFamilyEmail(normalizedFamilyEmail);
      return { ok: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedFamilyEmail,
      password: normalizedPassword,
    });

    if (error) return { ok: false, message: error.message };
    if (!data.session || !data.user) {
      return { ok: false, message: 'Supabase did not return a signed-in session.' };
    }

    applySignedInSession(data.session);
    return { ok: true };
  }

  async function signOut() {
    clearStoredActiveProfileId(familyEmail);
    setAuthSession(null);
    setAuthUser(null);
    setFamilyEmail('');
    setActiveProfileId(null);
    clearStoredFamilyEmail();
    applyPersistedState(INITIAL_REMOTE_STATE);
    if (supabase && authSession) {
      await supabase.auth.signOut();
    }
  }

  async function sendPasswordReset(submittedFamilyEmail: string): Promise<AuthActionResult> {
    const normalizedFamilyEmail = normalizeFamilyEmail(submittedFamilyEmail);
    if (!normalizedFamilyEmail) return { ok: false, message: 'Enter your email address.' };
    if (!supabase) return { ok: false, message: 'Supabase is not configured for this app.' };

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedFamilyEmail);
    if (error) return { ok: false, message: error.message };

    return { ok: true, message: 'Check your email for a reset link.' };
  }

  function selectActiveProfile(profileId: string) {
    setActiveProfileId(profileId);
    storeActiveProfileId(familyEmail, profileId);
  }

  function clearActiveProfile() {
    setActiveProfileId(null);
    clearStoredActiveProfileId(familyEmail);
  }

  async function createFamily(
    submittedFamilyName: string,
    submittedYourName: string,
    submittedFamilyEmail: string,
    password: string,
  ): Promise<AuthActionResult> {
    const normalizedFamilyName = submittedFamilyName.trim();
    const normalizedYourName = submittedYourName.trim();
    const normalizedFamilyEmail = normalizeFamilyEmail(submittedFamilyEmail);
    const normalizedPassword = password.trim();
    if (!normalizedFamilyName || !normalizedYourName || !normalizedFamilyEmail || !normalizedPassword) {
      return { ok: false, message: 'Complete every field to create your family.' };
    }

    const nextState = createInitialFamilyState(normalizedFamilyName, normalizedYourName);
    let canPersistNewState = isSupabaseConfigured;

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedFamilyEmail,
        password: normalizedPassword,
        options: {
          data: {
            display_name: normalizedYourName,
            family_name: normalizedFamilyName,
          },
        },
      });

      if (error) return { ok: false, message: error.message };
      if (!data.session || !data.user) {
        return {
          ok: true,
          needsEmailConfirmation: true,
          message: 'Check your email to confirm the new account, then sign in.',
        };
      }

      applySignedInSession(data.session);
      skipNextRemoteLoadRef.current = data.user.id;
      try {
        await saveFamilyState(data.user.id, normalizedFamilyEmail, nextState);
      } catch (error) {
        console.warn('Unable to save the new family state to Supabase.', error);
        canPersistNewState = false;
      }
    } else {
      setFamilyEmail(normalizedFamilyEmail);
      storeFamilyEmail(normalizedFamilyEmail);
    }

    applyPersistedState(nextState);
    setCanPersistRemoteState(canPersistNewState);
    setHasLoadedRemoteState(true);
    setActiveProfileId(null);
    clearStoredActiveProfileId(normalizedFamilyEmail);
    return { ok: true };
  }

  function addMember(member: Omit<FamilyMember, 'id'>) {
    const newMember = { ...member, id: `member-${Date.now()}` };
    setMembers((prev) => [...prev, newMember]);
    setDashboardMembers((prev) => [...prev, newMember]);
  }

  function updateMember(id: string, member: Omit<FamilyMember, 'id'>) {
    const nextMember = { ...member, id };
    setMembers((prev) => prev.map((item) => (item.id === id ? nextMember : item)));
    setDashboardMembers((prev) => prev.map((item) => (item.id === id ? nextMember : item)));
    setEvents((prev) => prev.map((item) => (item.personId === id ? { ...item, color: member.color } : item)));
    setDashboardEvents((prev) => prev.map((item) => (item.personId === id ? { ...item, color: member.color } : item)));
    setTasks((prev) => prev.map((item) => (item.personId === id ? { ...item, color: member.color } : item)));
    setProfileTasks((prev) => prev.map((item) => (item.personId === id ? { ...item, color: member.color } : item)));
  }

  function deleteMember(id: string) {
    const removeDeletedEventAssignment = (item: AppEvent): AppEvent | null => {
      const remainingPersonIds = (item.personIds ?? [item.personId]).filter((personId) => personId !== id);
      if (remainingPersonIds.length === 0) return null;
      return { ...item, personId: remainingPersonIds[0], personIds: remainingPersonIds };
    };
    const removeDeletedTaskAssignment = (item: AppTask): AppTask | null => {
      const remainingPersonIds = (item.personIds ?? [item.personId]).filter((personId) => personId !== id);
      if (remainingPersonIds.length === 0) return null;
      return { ...item, personId: remainingPersonIds[0], personIds: remainingPersonIds };
    };

    setMembers((prev) => prev.filter((item) => item.id !== id));
    setDashboardMembers((prev) => prev.filter((item) => item.id !== id));
    setEvents((prev) => prev.map(removeDeletedEventAssignment).filter((item): item is AppEvent => Boolean(item)));
    setDashboardEvents((prev) => prev.map(removeDeletedEventAssignment).filter((item): item is AppEvent => Boolean(item)));
    setTasks((prev) => prev.map(removeDeletedTaskAssignment).filter((item): item is AppTask => Boolean(item)));
    setProfileTasks((prev) => prev.map(removeDeletedTaskAssignment).filter((item): item is AppTask => Boolean(item)));
    setGroceries((prev) => prev.filter((item) => item.personId !== id));
    if (activeProfileId === id) clearActiveProfile();
  }

  function addEvent(event: Omit<AppEvent, 'id'>) {
    const newEvent = { ...event, id: `event-${Date.now()}` };
    setEvents((prev) => [...prev, newEvent]);
    setDashboardEvents((prev) => [...prev, newEvent]);
  }

  function updateEvent(id: string, event: Omit<AppEvent, 'id'>) {
    setEvents((prev) => prev.map((item) => (item.id === id ? { ...event, id } : item)));
    setDashboardEvents((prev) => prev.map((item) => (item.id === id ? { ...event, id } : item)));
  }

  function updateRecurringEventOccurrence(id: string, occurrenceDate: string, event: Omit<AppEvent, 'id'>) {
    const timestamp = Date.now();
    const updateCollection = (items: AppEvent[]) => {
      const original = items.find((item) => item.id === id);
      if (!original) return items;
      const replacementEvents = buildOccurrenceUpdateEvents(original, occurrenceDate, event, timestamp);
      return items.flatMap((item) => (item.id === id ? replacementEvents : [item]));
    };

    setEvents(updateCollection);
    setDashboardEvents(updateCollection);
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((item) => item.id !== id));
    setDashboardEvents((prev) => prev.filter((item) => item.id !== id));
  }

  function addTask(task: Omit<AppTask, 'id' | 'done'>) {
    const newTask = { ...task, id: `task-${Date.now()}`, done: false };
    setTasks((prev) => [...prev, newTask]);
    setProfileTasks((prev) => [...prev, newTask]);
  }

  function updateTask(id: string, task: Omit<AppTask, 'id'>) {
    setTasks((prev) => prev.map((item) => (item.id === id ? { ...task, id } : item)));
    setProfileTasks((prev) => prev.map((item) => (item.id === id ? { ...task, id } : item)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((item) => item.id !== id));
    setProfileTasks((prev) => prev.filter((item) => item.id !== id));
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    setProfileTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function addGroceryItem(item: Omit<GroceryItem, 'id' | 'checked'>) {
    setGroceries((prev) => [...prev, { ...item, id: `grocery-${Date.now()}`, checked: false }]);
  }

  function toggleGroceryItem(id: string) {
    setGroceries((prev) => prev.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g)));
  }

  function removeGroceryItem(id: string) {
    setGroceries((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <AppStateContext.Provider
      value={{
        authUser, isAuthLoading, isFamilyStateLoading: Boolean(familyEmail && isSupabaseConfigured && !hasLoadedRemoteState),
        familyEmail, familyName, activeProfileId, activeProfile, canManageFamily,
        members, dashboardMembers, events, dashboardEvents, tasks, profileTasks, groceries,
        setFamilyName, setMembers, signInFamily, signOut, sendPasswordReset, selectActiveProfile, clearActiveProfile, addMember, updateMember, deleteMember, createFamily, addEvent, updateEvent, updateRecurringEventOccurrence, deleteEvent, addTask, updateTask, deleteTask, toggleTask,
        addGroceryItem, toggleGroceryItem, removeGroceryItem,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
}
