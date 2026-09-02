import React, { createContext, useContext, useState } from 'react';
import {
  clearStoredActiveProfileId,
  clearStoredFamilyEmail,
  getStoredActiveProfileId,
  getStoredFamilyEmail,
  normalizeFamilyEmail,
  storeActiveProfileId,
  storeFamilyEmail,
} from '@/utils/deviceProfileStorage';
import { profileCanManage } from '@/utils/profilePermissions';

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
  signInFamily: (familyEmail: string) => void;
  signOut: () => void;
  selectActiveProfile: (profileId: string) => void;
  clearActiveProfile: () => void;
  addMember: (member: Omit<FamilyMember, 'id'>) => void;
  updateMember: (id: string, member: Omit<FamilyMember, 'id'>) => void;
  deleteMember: (id: string) => void;
  createFamily: (familyName: string, yourName: string, familyEmail: string) => void;
  addEvent: (event: Omit<AppEvent, 'id'>) => void;
  updateEvent: (id: string, event: Omit<AppEvent, 'id'>) => void;
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

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const storedFamilyEmail = getStoredFamilyEmail();
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

  const allMembers = [
    ...members,
    ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id)),
  ];
  const activeProfile = allMembers.find((member) => member.id === activeProfileId) ?? null;
  const canManageFamily = profileCanManage(activeProfile);

  function signInFamily(submittedFamilyEmail: string) {
    const normalizedFamilyEmail = normalizeFamilyEmail(submittedFamilyEmail);
    if (!normalizedFamilyEmail) return;
    const storedProfileId = getStoredActiveProfileId(normalizedFamilyEmail);

    setFamilyEmail(normalizedFamilyEmail);
    setActiveProfileId(storedProfileId);
    storeFamilyEmail(normalizedFamilyEmail);
  }

  function signOut() {
    clearStoredActiveProfileId(familyEmail);
    setFamilyEmail('');
    setActiveProfileId(null);
    clearStoredFamilyEmail();
  }

  function selectActiveProfile(profileId: string) {
    setActiveProfileId(profileId);
    storeActiveProfileId(familyEmail, profileId);
  }

  function clearActiveProfile() {
    setActiveProfileId(null);
    clearStoredActiveProfileId(familyEmail);
  }

  function createFamily(submittedFamilyName: string, submittedYourName: string, submittedFamilyEmail: string) {
    const normalizedFamilyName = submittedFamilyName.trim();
    const normalizedYourName = submittedYourName.trim();
    const normalizedFamilyEmail = normalizeFamilyEmail(submittedFamilyEmail);
    if (!normalizedFamilyName || !normalizedYourName || !normalizedFamilyEmail) return;

    const nameParts = normalizedYourName.split(/\s+/).filter(Boolean);
    const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME';
    const creator: FamilyMember = {
      id: `member-${Date.now()}`,
      name: normalizedYourName,
      nickname: nameParts[0] ?? normalizedYourName,
      role: 'Parent',
      initials,
      color: '#9b5cf6',
    };

    setFamilyName(normalizedFamilyName);
    setFamilyEmail(normalizedFamilyEmail);
    setMembers([creator]);
    setDashboardMembers([creator]);
    setEvents([]);
    setDashboardEvents([]);
    setTasks([]);
    setProfileTasks([]);
    setGroceries([]);
    setActiveProfileId(null);
    storeFamilyEmail(normalizedFamilyEmail);
    clearStoredActiveProfileId(normalizedFamilyEmail);
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
        familyEmail, familyName, activeProfileId, activeProfile, canManageFamily,
        members, dashboardMembers, events, dashboardEvents, tasks, profileTasks, groceries,
        setFamilyName, setMembers, signInFamily, signOut, selectActiveProfile, clearActiveProfile, addMember, updateMember, deleteMember, createFamily, addEvent, updateEvent, deleteEvent, addTask, updateTask, deleteTask, toggleTask,
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
