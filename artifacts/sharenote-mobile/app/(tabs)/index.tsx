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
import { useAppState } from '@/context/AppState';
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { familyName, members, dashboardMembers, dashboardEvents, tasks, groceries, toggleTask } = useAppState();

  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayEvents = dashboardEvents.filter(e => e.date === '2025-08-12');
  const todayTasks = tasks.filter(t => t.date === '2025-08-12');
  const groceryPreview = groceries.filter(grocery => grocery.displayOnDashboard);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerLeft}>
          <MemberAvatar member={members[0]} size={32} headerPhoto />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Our Home
        </Text>
        <Pressable style={styles.headerRight}>
          <Feather name="bell" size={20} color={colors.foreground} />
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
              Wednesday, August 12
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarsRow}>
          {dashboardMembers.map(m => (
            <View key={m.id} style={styles.avatarItem}>
              <MemberAvatar member={m} size={64} />
              <Text style={[styles.avatarName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {m.nickname}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.weekCalendar, { backgroundColor: '#fff' }]}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const date = 23 + i;
            const isSelected = date === 26;
            return (
              <View key={i} style={[styles.weekDay, isSelected && { backgroundColor: colors.primary }]}>
                <Text style={[styles.weekDayName, { color: isSelected ? '#fff' : colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{day}</Text>
                <Text style={[styles.weekDayDate, { color: isSelected ? '#fff' : colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{date}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Today's Schedule</Text>
            <Pressable testID="view-all-schedule" accessibilityLabel="View all scheduled events" onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={[styles.sectionLink, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>View All</Text>
            </Pressable>
          </View>
          {todayEvents.map(evt => {
            const person = dashboardMembers.find(m => m.id === evt.personId);
            return (
              <View key={evt.id} style={[styles.card, { backgroundColor: '#fff' }]}>
                <View style={[styles.cardLeftBorder, { backgroundColor: evt.color }]} />
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{evt.title}</Text>
                  <View style={styles.cardMeta}>
                    <Feather name="clock" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{evt.time}</Text>
                  </View>
                </View>
                {person && <MemberAvatar member={person} size={40} />}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Tasks</Text>
          <View style={[styles.card, styles.tasksCard, { backgroundColor: '#fff' }]}>
            {todayTasks.slice(0, 1).map(task => {
              const person = members.find(m => m.id === task.personId);
              return (
                <View key={task.id} style={styles.taskRow}>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTask(task.id); }} style={[styles.checkbox, task.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {task.done && <Feather name="check" size={14} color="#fff" />}
                  </Pressable>
                  <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: 'Inter_500Medium', textDecorationLine: task.done ? 'line-through' : 'none' }]}>{task.title}</Text>
                  {person && <MemberAvatar member={person} size={32} />}
                </View>
              );
            })}
            <View style={styles.divider} />
            <Pressable style={styles.addTaskRow} onPress={() => router.push('/add-task')}>
              <Feather name="plus" size={18} color={colors.mutedForeground} />
              <Text style={[styles.addTaskText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Add Task</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Grocery</Text>
          <View style={[styles.groceryCard, { backgroundColor: '#fff' }]}>
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

      <Pressable
        testID="quick-add-fab"
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
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

      {/* Quick Add Modal */}
      <Modal visible={showQuickAdd} transparent animationType="fade" onRequestClose={() => setShowQuickAdd(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowQuickAdd(false)} />
          <View style={[styles.modalContent, { paddingBottom: bottomPad + 24 }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Quick Add</Text>
              <Pressable onPress={() => setShowQuickAdd(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <Pressable style={[styles.modalOption, { borderColor: colors.border }]} onPress={() => { setShowQuickAdd(false); setTimeout(() => router.push('/add-event'), 300); }}>
              <View style={[styles.modalOptionIcon, { backgroundColor: '#f0ecff' }]}>
                <Feather name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Add Event</Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Schedule a family activity</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.border} />
            </Pressable>

            <Pressable style={[styles.modalOption, { borderColor: colors.border }]} onPress={() => { setShowQuickAdd(false); setTimeout(() => router.push('/add-task'), 300); }}>
              <View style={[styles.modalOptionIcon, { backgroundColor: '#f0ecff' }]}>
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
  greetingTitle: { fontSize: 32, letterSpacing: -0.8, lineHeight: 40 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15 },
  avatarsRow: { gap: 20, paddingRight: 24, paddingVertical: 4 },
  avatarItem: { alignItems: 'center', gap: 8 },
  avatarName: { fontSize: 14 },
  weekCalendar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 24, shadowColor: '#935bf0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  weekDay: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16 },
  weekDayName: { fontSize: 13 },
  weekDayDate: { fontSize: 16 },
  section: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 22, letterSpacing: -0.5 },
  sectionLink: { fontSize: 14 },
  card: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', padding: 20, gap: 16, shadowColor: '#935bf0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  cardLeftBorder: { position: 'absolute', left: 0, top: 20, bottom: 20, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  cardContent: { flex: 1, gap: 6, marginLeft: 8 },
  cardTitle: { fontSize: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13 },
  tasksCard: { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 24, gap: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#e8e0f7', alignItems: 'center', justifyContent: 'center' },
  taskTitle: { flex: 1, fontSize: 16 },
  divider: { height: 1, backgroundColor: '#f0ecff' },
  addTaskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addTaskText: { fontSize: 15 },
  groceryCard: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, shadowColor: '#935bf0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  groceryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f8ff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, gap: 8 },
  groceryDot: { width: 6, height: 6, borderRadius: 3 },
  groceryText: { fontSize: 14 },
  groceryAddBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', shadowColor: '#935bf0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e8e0f7', alignSelf: 'center', marginBottom: 8 },
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