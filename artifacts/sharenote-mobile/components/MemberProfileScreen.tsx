import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { AppEvent, AppTask, useAppState } from '@/context/AppState';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { MemberAvatar } from '@/components/MemberAvatar';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { ProfileRolePicker } from '@/components/ProfileRolePicker';
import { isAssignedToPerson } from '@/utils/assignments';
import { normalizeProfileRole } from '@/utils/profilePermissions';

const MEMBER_COLORS = ['#9b5cf6', '#f6a53a', '#12c7a0', '#f04e9b', '#5bb6ff', '#ef4444', '#22c55e', '#6366f1'];

function initialsFromName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'ME';
}

export default function MemberProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    members,
    dashboardMembers,
    profileTasks,
    events,
    dashboardEvents,
    canManageFamily,
    toggleTask,
    deleteEvent,
    deleteTask,
    updateMember,
    deleteMember,
  } = useAppState();
  const [activeTab, setActiveTab] = useState<'tasks' | 'events'>('tasks');
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<AppTask | null>(null);
  const [showEditMember, setShowEditMember] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftColor, setDraftColor] = useState(MEMBER_COLORS[0]);

  const allMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const allEvents = [...events, ...dashboardEvents.filter((event) => !events.some((item) => item.id === event.id))];
  const member = allMembers.find((item) => item.id === id);
  const memberTasks = profileTasks.filter((task) => isAssignedToPerson(task, id));
  const memberEvents = allEvents.filter((event) => isAssignedToPerson(event, id));
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!member) return null;

  function openAddTask() {
    if (!member || !canManageFamily) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/add-task',
      params: { personId: member.id },
    });
  }

  function openAddEvent() {
    if (!member || !canManageFamily) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/add-event',
      params: { personId: member.id },
    });
  }

  function editSelectedEvent(event: AppEvent) {
    if (!canManageFamily) return;
    setSelectedEvent(null);
    router.push({
      pathname: '/add-event',
      params: { editEventId: event.id, occurrenceDate: event.date },
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

  function openEditMember() {
    if (!member || !canManageFamily) return;
    setDraftName(member.name);
    setDraftRole(normalizeProfileRole(member.role));
    setDraftColor(member.color);
    setShowEditMember(true);
  }

  function saveMemberChanges() {
    if (!member || !canManageFamily || !draftName.trim() || !draftRole.trim()) return;
    const normalizedName = draftName.trim();
    const nameParts = normalizedName.split(/\s+/).filter(Boolean);
    updateMember(member.id, {
      name: normalizedName,
      nickname: nameParts[0] ?? normalizedName,
      role: draftRole.trim(),
      initials: initialsFromName(normalizedName),
      color: draftColor,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEditMember(false);
  }

  function removeMember() {
    if (!member || !canManageFamily) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteMember(member.id);
    setShowEditMember(false);
    router.replace('/family');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerLeft}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          {member.name}
        </Text>
        {canManageFamily ? (
          <Pressable
            accessibilityLabel={`Edit ${member.name}`}
            onPress={openEditMember}
            style={[styles.headerRight, styles.editButton, { backgroundColor: colors.secondary }]}
          >
            <Feather name="edit-2" size={18} color={colors.primaryStrong} />
          </Pressable>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHero}>
          <MemberAvatar member={member} size={100} borderWidth={4} />
          <Text style={[styles.heroName, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            {member.name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={12} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
              {member.role}
            </Text>
          </View>
        </View>

        {canManageFamily ? (
          <View style={styles.quickAddRow}>
            <Pressable
              testID="member-add-task-button"
              accessibilityLabel={`Add task for ${member.name}`}
              style={({ pressed }) => [
                styles.quickAddButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
              onPress={openAddTask}
            >
              <View style={[styles.quickAddIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="check-square" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.quickAddText, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
                Add Task
              </Text>
            </Pressable>

            <Pressable
              testID="member-add-event-button"
              accessibilityLabel={`Add event for ${member.name}`}
              style={({ pressed }) => [
                styles.quickAddButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              onPress={openAddEvent}
            >
              <View style={[styles.quickAddIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Feather name="calendar" size={18} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.quickAddText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Add Event
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.tabs, { backgroundColor: colors.chip }]}>
          {(['tasks', 'events'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.activeTab, { backgroundColor: colors.card, shadowColor: colors.shadow }],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? colors.primaryStrong : colors.mutedForeground,
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                {tab === 'tasks' ? 'Tasks' : 'Events'}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'tasks' ? (
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={[styles.tasksTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Assigned Tasks
              </Text>
              <Text style={[styles.tasksCount, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
                {memberTasks.filter((task) => !task.done).length} Open
              </Text>
            </View>
            <View style={styles.tasksList}>
              {memberTasks.map((task) => (
                <Pressable
                  key={task.id}
                  testID={`member-task-${task.id}`}
                  accessibilityLabel={`View task details: ${task.title}`}
                  style={[styles.taskCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTask(task);
                  }}
                >
                  <View style={[styles.cardLeftBorder, { backgroundColor: task.color }]} />
                  <Pressable
                    accessibilityLabel={`${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                    disabled={!canManageFamily}
                    onPress={() => {
                      if (!canManageFamily) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleTask(task.id);
                    }}
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      !canManageFamily && styles.disabledControl,
                      task.done && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    {task.done && <Feather name="check" size={14} color="#fff" />}
                  </Pressable>
                  <View style={styles.taskContent}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: colors.foreground,
                          fontFamily: 'Inter_600SemiBold',
                          textDecorationLine: task.done ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Feather
                        name={task.location.includes('Shop') ? 'shopping-cart' : task.location.includes('Today') ? 'dollar-sign' : 'edit-2'}
                        size={14}
                        color={colors.mutedForeground}
                      />
                      <Text style={[styles.taskMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                        {task.location.includes('Shop') ? 'List: ' : ''}
                        {task.location}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.tasksSection}>
            <View style={styles.tasksHeader}>
              <Text style={[styles.tasksTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Upcoming Events
              </Text>
              <Text style={[styles.tasksCount, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
                {memberEvents.length} Total
              </Text>
            </View>
            <View style={styles.tasksList}>
              {memberEvents.map((event) => (
                <Pressable
                  key={event.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedEvent(event);
                  }}
                  style={[styles.taskCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
                >
                  <View style={[styles.cardLeftBorder, { backgroundColor: event.color }]} />
                  <View style={styles.eventIcon}>
                    <Feather name="calendar" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                      {event.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Feather name="clock" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.taskMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                        {event.time}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
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

      <Modal visible={canManageFamily && showEditMember} transparent animationType="fade" onRequestClose={() => setShowEditMember(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowEditMember(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Edit Profile
              </Text>
              <Pressable onPress={() => setShowEditMember(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Name
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Permission
              </Text>
              <ProfileRolePicker value={draftRole} onChange={setDraftRole} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Color
              </Text>
              <View style={styles.colorGrid}>
                {MEMBER_COLORS.map((color) => {
                  const selected = color === draftColor;
                  return (
                    <Pressable
                      key={color}
                      accessibilityLabel={`Select color ${color}`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDraftColor(color);
                      }}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          borderColor: selected ? colors.foreground : colors.card,
                        },
                      ]}
                    >
                      {selected ? <Feather name="check" size={18} color="#ffffff" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={saveMemberChanges}
                style={[styles.saveMemberButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.saveMemberText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  Save Changes
                </Text>
              </Pressable>
              <Pressable
                onPress={removeMember}
                style={[styles.deleteMemberButton, { backgroundColor: colors.accentDangerSoft }]}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
                <Text style={[styles.deleteMemberText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                  Delete User
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 40 },
  headerRight: { width: 40, alignItems: 'center', justifyContent: 'center' },
  editButton: { height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 32 },
  profileHero: { alignItems: 'center', gap: 12 },
  heroName: { fontSize: 24 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, gap: 6 },
  roleText: { fontSize: 13 },
  quickAddRow: { flexDirection: 'row', gap: 12 },
  quickAddButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  quickAddIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickAddText: { fontSize: 15 },
  tabs: { flexDirection: 'row', borderRadius: 16, padding: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  activeTab: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  tabText: { fontSize: 15 },
  tasksSection: { gap: 16 },
  tasksHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tasksTitle: { fontSize: 20 },
  tasksCount: { fontSize: 14 },
  tasksList: { gap: 12 },
  taskCard: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingLeft: 24,
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardLeftBorder: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  disabledControl: { opacity: 0.45 },
  eventIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  taskContent: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 16 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskMetaText: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14 },
  inputContainer: { height: 52, borderRadius: 12, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  modalActions: { gap: 12, paddingTop: 4 },
  saveMemberButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveMemberText: { fontSize: 16 },
  deleteMemberButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  deleteMemberText: { fontSize: 16 },
});
