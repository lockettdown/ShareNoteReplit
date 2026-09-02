import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppEvent, AppTask, useAppState } from '@/context/AppState';
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { AssignedMemberAvatars } from '@/components/AssignedMemberAvatars';
import { getAssignedMembers } from '@/utils/assignments';
import { itemOccursOn, parseCanonicalDate, toCanonicalDate } from '@/utils/schedule';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_START = new Date(2025, 7, 10);

function formatLongDate(value: string) {
  const date = parseCanonicalDate(value);
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

const WEEK_DAYS = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(WEEK_START);
  date.setDate(WEEK_START.getDate() + index);
  return {
    label: DAY_LABELS[date.getDay()],
    day: date.getDate(),
    value: toCanonicalDate(date.getFullYear(), date.getMonth(), date.getDate()),
  };
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { familyName, activeProfile, canManageFamily, members, dashboardMembers, events, dashboardEvents, tasks, groceries, toggleTask, deleteEvent, deleteTask } = useAppState();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<AppTask | null>(null);
  const [selectedDate, setSelectedDate] = useState('2025-08-12');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const groceryPreview = groceries.filter(grocery => grocery.displayOnDashboard);
  const allMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const allEvents = [...dashboardEvents, ...events.filter((event) => !dashboardEvents.some((item) => item.id === event.id))];
  const selectedEvents = allEvents.filter(e => itemOccursOn(e, selectedDate));
  const selectedTasks = tasks.filter(t => itemOccursOn(t, selectedDate));

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
          Our Home
        </Text>
        <Pressable style={styles.headerRight}>
          <Feather name="bell" size={20} color={colors.primaryStrong} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            Good Morning,{'\n'}{familyName}
          </Text>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {formatLongDate(selectedDate)}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarsRow}>
          {dashboardMembers.map(m => (
            <Pressable
              key={m.id}
              style={styles.avatarItem}
              onPress={() => router.push(`/family/member/${m.id}`)}
            >
              <MemberAvatar member={m} size={64} />
              <Text style={[styles.avatarName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {m.nickname}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.weekCalendar, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          {WEEK_DAYS.map((day) => {
            const isSelected = day.value === selectedDate;
            return (
              <Pressable
                key={day.value}
                accessibilityLabel={`Show schedule for ${formatLongDate(day.value)}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedDate(day.value);
                }}
                style={({ pressed }) => [
                  styles.weekDay,
                  isSelected && { backgroundColor: colors.primary },
                  { opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <Text style={[styles.weekDayName, { color: isSelected ? '#fff' : colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{day.label}</Text>
                <Text style={[styles.weekDayDate, { color: isSelected ? '#fff' : colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{day.day}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Schedule</Text>
            <Pressable testID="view-all-schedule" accessibilityLabel="View all scheduled events" onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={[styles.sectionLink, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>View All</Text>
            </Pressable>
          </View>
          {selectedEvents.map(evt => {
            const assignedMembers = getAssignedMembers(evt, allMembers);
            return (
              <Pressable
                key={evt.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedEvent(evt);
                }}
                style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              >
                <View style={[styles.cardLeftBorder, { backgroundColor: evt.color }]} />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{evt.title}</Text>
                  <View style={styles.cardMeta}>
                    <Feather name="clock" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{evt.time}</Text>
                  </View>
                </View>
                <AssignedMemberAvatars members={assignedMembers} size={36} />
              </Pressable>
            );
          })}
          {selectedEvents.length === 0 && (
            <Text style={[styles.emptyState, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              No events scheduled for this date.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Tasks</Text>
          <View style={[styles.card, styles.tasksCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            {selectedTasks.map(task => {
              const assignedMembers = getAssignedMembers(task, allMembers);
              return (
                <Pressable
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTask(task);
                  }}
                >
                  <Pressable
                    disabled={!canManageFamily}
                    onPress={() => {
                      if (!canManageFamily) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleTask(task.id);
                    }}
                    style={[styles.checkbox, !canManageFamily && styles.disabledControl, task.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    {task.done && <Feather name="check" size={14} color="#fff" />}
                  </Pressable>
                  <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: 'Inter_500Medium', textDecorationLine: task.done ? 'line-through' : 'none' }]}>{task.title}</Text>
                  <AssignedMemberAvatars members={assignedMembers} size={32} maxVisible={2} />
                </Pressable>
              );
            })}
            {selectedTasks.length === 0 && (
              <Text style={[styles.emptyState, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                No tasks due for this date.
              </Text>
            )}
            {canManageFamily ? (
              <>
                <View style={styles.divider} />
                <Pressable style={styles.addTaskRow} onPress={() => router.push('/add-task')}>
                  <Feather name="plus" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.addTaskText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Add Task</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Grocery</Text>
          <View style={[styles.groceryCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            {groceryPreview.map(grocery => (
              <View key={grocery.id} style={styles.groceryPill}>
                <View style={[styles.groceryDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.groceryText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>{grocery.name}</Text>
              </View>
            ))}
            <Pressable testID="view-all-groceries" accessibilityLabel="View all groceries" style={[styles.groceryAddBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/groceries')}>
              <Feather name="plus" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {canManageFamily ? (
        <Pressable
          testID="quick-add-fab"
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.shadow,
              bottom: bottomPad + 100,
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowQuickAdd(true);
          }}
        >
          <Feather name="plus" size={24} color="#fff" />
        </Pressable>
      ) : null}

      {/* Quick Add Modal */}
      <Modal visible={canManageFamily && showQuickAdd} transparent animationType="fade" onRequestClose={() => setShowQuickAdd(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowQuickAdd(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Quick Add</Text>
              <Pressable onPress={() => setShowQuickAdd(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <Pressable style={[styles.modalOption, { borderColor: colors.border }]} onPress={() => { setShowQuickAdd(false); setTimeout(() => router.push('/add-event'), 300); }}>
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Add Event</Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Schedule a family activity</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Pressable>

            <Pressable style={[styles.modalOption, { borderColor: colors.border }]} onPress={() => { setShowQuickAdd(false); setTimeout(() => router.push('/add-task'), 300); }}>
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="check-square" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Add Task</Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Create a new household chore</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Pressable>

            <Pressable style={[styles.modalCancelBtn, { borderColor: colors.primary }]} onPress={() => setShowQuickAdd(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 32 },
  headerRight: { width: 32, alignItems: 'flex-end' },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 32, paddingTop: 16 },
  greetingSection: { gap: 8 },
  greetingTitle: { fontSize: 32, lineHeight: 40 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15 },
  avatarsRow: { gap: 20, paddingRight: 24, paddingVertical: 4 },
  avatarItem: { alignItems: 'center', gap: 8 },
  avatarName: { fontSize: 14 },
  weekCalendar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  weekDay: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16 },
  weekDayName: { fontSize: 13 },
  weekDayDate: { fontSize: 16 },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 22 },
  sectionLink: { fontSize: 14 },
  emptyState: { fontSize: 15, textAlign: 'center', paddingVertical: 12 },
  card: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', padding: 20, gap: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardLeftBorder: { position: 'absolute', left: 0, top: 20, bottom: 20, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  cardContent: { flex: 1, gap: 6, marginLeft: 8 },
  cardTitle: { fontSize: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13 },
  tasksCard: { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 24, gap: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#e1d8f2', alignItems: 'center', justifyContent: 'center' },
  disabledControl: { opacity: 0.45 },
  taskTitle: { flex: 1, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#ece6f5' },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addTaskText: { fontSize: 15 },
  groceryCard: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  groceryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f4fb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, gap: 8 },
  groceryDot: { width: 6, height: 6, borderRadius: 3 },
  groceryText: { fontSize: 14 },
  groceryAddBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', shadowColor: '#9b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
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
  modalCancelBtn: { alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 8 },
  modalCancelText: { fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
});
