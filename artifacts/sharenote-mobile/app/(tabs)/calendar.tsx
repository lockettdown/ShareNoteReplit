import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { AppEvent, AppTask, useAppState } from '@/context/AppState';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { MemberAvatar } from '@/components/MemberAvatar';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { AssignedMemberAvatars } from '@/components/AssignedMemberAvatars';
import { useRouter } from 'expo-router';
import { getAssignedMembers } from '@/utils/assignments';
import { itemOccursOn, toCanonicalDate } from '@/utils/schedule';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildCalendarGrid(year: number, month: number) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const rows = [];
  let day = 1 - startDay;
  while (day <= totalDays) {
    const week = [];
    for (let col = 0; col < 7; col++) {
      week.push(day >= 1 && day <= totalDays ? day : null);
      day++;
    }
    rows.push(week);
  }
  return rows;
}

function timeToMinutes(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { events, dashboardEvents, tasks, members, dashboardMembers, activeProfile, canManageFamily, deleteEvent, deleteTask } = useAppState();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<AppTask | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const grid = buildCalendarGrid(viewYear, viewMonth);
  const allMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const allEvents = [...events, ...dashboardEvents.filter((event) => !events.some((item) => item.id === event.id))];

  const selectedDate = toCanonicalDate(viewYear, viewMonth, selectedDay);
  const displayItems = [
    ...allEvents.map((event) => ({ ...event, kind: 'event' as const })),
    ...tasks.map((task) => ({ ...task, kind: 'task' as const })),
  ]
    .filter((event) => itemOccursOn(event, selectedDate))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const selectedDateLabel = `Schedule for ${MONTH_NAMES[viewMonth].substring(0, 3)} ${selectedDay}`;
  const dotsByDay = [...allEvents, ...tasks].reduce<Record<number, string[]>>((acc, item) => {
    for (let day = 1; day <= new Date(viewYear, viewMonth + 1, 0).getDate(); day++) {
      const dayDate = toCanonicalDate(viewYear, viewMonth, day);
      if (!itemOccursOn(item, dayDate)) continue;
      const colorsForDay = acc[day] ?? [];
      const assignedColors = getAssignedMembers(item, allMembers).map((member) => member.color);
      const nextColors = assignedColors.length ? assignedColors : [item.color];
      acc[day] = [...colorsForDay, ...nextColors]
        .filter((color, index, colors) => colors.indexOf(color) === index)
        .slice(0, 3);
    }
    return acc;
  }, {});

  function changeMonth(offset: number) {
    const nextMonth = viewMonth + offset;
    if (nextMonth < 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else if (nextMonth > 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth(nextMonth);
    }
  }

  function editSelectedEvent(event: AppEvent) {
    if (!canManageFamily) return;
    setSelectedEvent(null);
    router.push({
      pathname: '/add-event',
      params: { editEventId: event.id },
    });
  }

  function deleteSelectedEvent(event: AppEvent) {
    if (!canManageFamily) return;
    deleteEvent(event.id);
    setSelectedEvent(null);
  }

  function editSelectedTask(task: AppTask) {
    if (!canManageFamily) return;
    setSelectedTask(null);
    router.push({
      pathname: '/add-task',
      params: { editTaskId: task.id },
    });
  }

  function deleteSelectedTask(task: AppTask) {
    if (!canManageFamily) return;
    deleteTask(task.id);
    setSelectedTask(null);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          accessibilityLabel="Switch active profile"
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/profile-select');
          }}
          style={styles.headerLeft}
        >
          <MemberAvatar member={activeProfile ?? members[0]} size={32} headerPhoto={!activeProfile} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Calendar
        </Text>
        <View style={styles.headerRight}>
          {canManageFamily ? (
            <Pressable
              accessibilityLabel="Add event or task"
              onPress={() => {
                setShowQuickAdd(true);
              }}
              style={[styles.headerIconButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name="plus" size={20} color={colors.primaryStrong} />
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel="Alerts" style={styles.headerIconButton}>
            <Feather name="bell" size={20} color={colors.primaryStrong} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.calendarCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.navBtn}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.navBtn}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.dayLabelRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={[styles.dayLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {grid.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  const isSelected = day === selectedDay;
                  const isToday =
                    viewYear === today.getFullYear() &&
                    viewMonth === today.getMonth() &&
                    day === today.getDate();

                  const dots = day ? dotsByDay[day] ?? [] : [];

                  return (
                    <Pressable
                      key={di}
                      style={styles.dayCell}
                      onPress={() => day && setSelectedDay(day)}
                    >
                      {day !== null && (
                        <View style={[
                          styles.dayBackground,
                          isSelected && { backgroundColor: colors.secondary },
                          isToday && { backgroundColor: colors.primary }
                        ]}>
                          <Text style={[
                            styles.dayNumber,
                            {
                              color: isToday ? '#fff' : isSelected ? colors.primary : colors.foreground,
                              fontFamily: isSelected || isToday ? 'Inter_700Bold' : 'Inter_500Medium'
                            }
                          ]}>
                            {day}
                          </Text>
                        </View>
                      )}
                      <View style={styles.dotsRow}>
                        {dots.map((c, i) => (
                          <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.eventsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            {selectedDateLabel}
          </Text>

          {displayItems.map((item) => {
            const assignedMembers = getAssignedMembers(item, allMembers);
            return (
              <Pressable
                key={`${item.kind}-${item.id}`}
                onPress={() => {
                  if (item.kind === 'event') setSelectedEvent(item);
                  if (item.kind === 'task') setSelectedTask(item);
                }}
                style={[styles.eventCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              >
                <View style={[styles.cardLeftBorder, { backgroundColor: item.color }]} />
                <View style={[styles.itemIcon, { backgroundColor: colors.secondary }]}>
                  <Feather
                    name={item.kind === 'event' ? 'calendar' : 'check-square'}
                    size={18}
                    color={colors.primaryStrong}
                  />
                </View>
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTime, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    {item.time}
                  </Text>
                  <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  {item.title}
                </Text>
              </View>
                <AssignedMemberAvatars members={assignedMembers} />
              </Pressable>
            );
          })}
          {displayItems.length === 0 && (
            <Text style={[styles.emptyState, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              No events or tasks scheduled for this day.
            </Text>
          )}
        </View>
      </ScrollView>

      <EventDetailSheet
        event={selectedEvent}
        members={allMembers}
        visible={selectedEvent !== null}
        canManage={canManageFamily}
        onClose={() => setSelectedEvent(null)}
        onEdit={editSelectedEvent}
        onDelete={deleteSelectedEvent}
      />
      <TaskDetailSheet
        task={selectedTask}
        members={allMembers}
        visible={selectedTask !== null}
        canManage={canManageFamily}
        onClose={() => setSelectedTask(null)}
        onEdit={editSelectedTask}
        onDelete={deleteSelectedTask}
      />

      <Modal visible={canManageFamily && showQuickAdd} transparent animationType="fade" onRequestClose={() => setShowQuickAdd(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowQuickAdd(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Add
              </Text>
              <Pressable onPress={() => setShowQuickAdd(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.modalOption, { borderColor: colors.border }]}
              onPress={() => {
                setShowQuickAdd(false);
                router.push('/add-event');
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  Add Event
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Schedule something on the calendar
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Pressable>

            <Pressable
              style={[styles.modalOption, { borderColor: colors.border }]}
              onPress={() => {
                setShowQuickAdd(false);
                router.push('/add-task');
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="check-square" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  Add Task
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Add a task to a family schedule
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 84 },
  headerRight: { width: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  headerIconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 32 },
  calendarCard: {
    borderRadius: 32, padding: 24,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 4,
  },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 20 },
  dayLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  dayLabel: { width: 36, textAlign: 'center', fontSize: 13 },
  grid: { gap: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { width: 36, height: 48, alignItems: 'center' },
  dayBackground: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 15 },
  dotsRow: { flexDirection: 'row', gap: 4, marginTop: 4, height: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  eventsSection: { gap: 16 },
  sectionTitle: { fontSize: 22 },
  eventCard: {
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    overflow: 'hidden',
  },
  cardLeftBorder: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  itemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventContent: { flex: 1, paddingLeft: 8, gap: 4 },
  eventTime: { fontSize: 13 },
  eventTitle: { fontSize: 16 },
  emptyState: { fontSize: 15, textAlign: 'center', paddingVertical: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { fontSize: 24 },
  modalOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  modalOptionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalOptionTextWrapper: { flex: 1, gap: 4 },
  modalOptionTitle: { fontSize: 16 },
  modalOptionSubtitle: { fontSize: 13 },
});
