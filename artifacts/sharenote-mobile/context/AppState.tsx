import React, { createContext, useContext, useState } from 'react';

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
  personId: string;
  color: string;
};

export type AppTask = {
  id: string;
  title: string;
  time: string;
  date: string;
  location: string;
  personId: string;
  done: boolean;
  color: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  personId?: string;
  displayOnDashboard?: boolean;
};

type AppStateContextType = {
  familyName: string;
  members: FamilyMember[];
  dashboardMembers: FamilyMember[];
  events: AppEvent[];
  dashboardEvents: AppEvent[];
  tasks: AppTask[];
  profileTasks: AppTask[];
  groceries: GroceryItem[];
  setFamilyName: (familyName: string) => void;
  setMembers: (members: FamilyMember[]) => void;
  createFamily: (familyName: string, yourName: string) => void;
  addEvent: (event: Omit<AppEvent, 'id'>) => void;
  addTask: (task: Omit<AppTask, 'id' | 'done'>) => void;
  toggleTask: (id: string) => void;
  addGroceryItem: (item: Omit<GroceryItem, 'id' | 'checked'>) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
};

const AppStateContext = createContext<AppStateContextType | null>(null);

const INITIAL_MEMBERS: FamilyMember[] = [
  { id: 'm1', name: 'David Smith', nickname: 'Dad', role: 'Parent', initials: 'DS', color: '#4f46e5' },
  { id: 'm2', name: 'Maya Smith', nickname: 'Mom', role: 'Parent', initials: 'MS', color: '#e11d48' },
  { id: 'm3', name: 'Leo Smith', nickname: 'Jake', role: 'Child', initials: 'LS', color: '#059669' },
];

const INITIAL_DASHBOARD_MEMBERS: FamilyMember[] = [
  ...INITIAL_MEMBERS,
  { id: 'm4', name: 'Lily Smith', nickname: 'Lily', role: 'Child', initials: 'LY', color: '#d946ef' },
];

const INITIAL_EVENTS: AppEvent[] = [
  { id: 'e1', title: 'Dentist Appointment', time: '10:00 AM', date: '2025-08-12', personId: 'm2', color: '#3b82f6' },
  { id: 'e2', title: 'Baseball Practice', time: '4:30 PM - 6:00 PM', date: '2025-08-12', personId: 'm3', color: '#0d9488' },
  { id: 'e3', title: 'Family Dinner', time: '7:00 PM', date: '2025-08-12', personId: 'm1', color: '#8b5cf6' },
];

const INITIAL_DASHBOARD_EVENTS: AppEvent[] = [
  { id: 'e2', title: 'Baseball Practice', time: '4:30 PM - 6:00 PM', date: '2025-08-12', personId: 'm3', color: '#0d9488' },
  { id: 'e4', title: 'Piano Lesson', time: '6:00 PM - 7:00 PM', date: '2025-08-12', personId: 'm4', color: '#e11d48' },
];

const INITIAL_TASKS: AppTask[] = [
  { id: 't1', title: 'Take out garbage', time: '8:00 AM', date: '2025-08-12', location: 'Home', personId: 'm1', done: false, color: '#3b82f6' },
  { id: 't2', title: 'Finish homework', time: '4:00 PM', date: '2025-08-12', location: 'School', personId: 'm3', done: false, color: '#059669' },
  { id: 't3', title: 'Grocery shopping', time: '5:00 PM', date: '2025-08-12', location: 'Personal', personId: 'm2', done: false, color: '#8b5cf6' },
];

const INITIAL_PROFILE_TASKS: AppTask[] = [
  { id: 't4', title: 'Buy Groceries', time: '', date: '2025-08-12', location: 'Weekly Shop', personId: 'm1', done: false, color: '#8b5cf6' },
  { id: 't5', title: 'Fix the sink', time: '', date: '2025-08-12', location: 'Kitchen', personId: 'm1', done: false, color: '#8b5cf6' },
  { id: 't6', title: 'Pay bills', time: '', date: '2025-08-12', location: 'Due Today', personId: 'm1', done: false, color: '#3b82f6' },
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
  const [familyName, setFamilyName] = useState('Smith Family');
  const [members, setMembers] = useState<FamilyMember[]>(INITIAL_MEMBERS);
  const [dashboardMembers, setDashboardMembers] = useState<FamilyMember[]>(INITIAL_DASHBOARD_MEMBERS);
  const [events, setEvents] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [dashboardEvents, setDashboardEvents] = useState<AppEvent[]>(INITIAL_DASHBOARD_EVENTS);
  const [tasks, setTasks] = useState<AppTask[]>(INITIAL_TASKS);
  const [profileTasks, setProfileTasks] = useState<AppTask[]>(INITIAL_PROFILE_TASKS);
  const [groceries, setGroceries] = useState<GroceryItem[]>(INITIAL_GROCERIES);

  function createFamily(submittedFamilyName: string, submittedYourName: string) {
    const normalizedFamilyName = submittedFamilyName.trim();
    const normalizedYourName = submittedYourName.trim();
    if (!normalizedFamilyName || !normalizedYourName) return;

    const nameParts = normalizedYourName.split(/\s+/).filter(Boolean);
    const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ME';
    const creator: FamilyMember = {
      id: `member-${Date.now()}`,
      name: normalizedYourName,
      nickname: nameParts[0] ?? normalizedYourName,
      role: 'Parent',
      initials,
      color: '#4f46e5',
    };

    setFamilyName(normalizedFamilyName);
    setMembers([creator]);
    setDashboardMembers([creator]);
    setEvents([]);
    setDashboardEvents([]);
    setTasks([]);
    setProfileTasks([]);
    setGroceries([]);
  }

  function addEvent(event: Omit<AppEvent, 'id'>) {
    const newEvent = { ...event, id: `event-${Date.now()}` };
    setEvents((prev) => [...prev, newEvent]);
    setDashboardEvents((prev) => [...prev, newEvent]);
  }

  function addTask(task: Omit<AppTask, 'id' | 'done'>) {
    const newTask = { ...task, id: `task-${Date.now()}`, done: false };
    setTasks((prev) => [...prev, newTask]);
    setProfileTasks((prev) => [...prev, newTask]);
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
        familyName, members, dashboardMembers, events, dashboardEvents, tasks, profileTasks, groceries,
        setFamilyName, setMembers, createFamily, addEvent, addTask, toggleTask,
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
