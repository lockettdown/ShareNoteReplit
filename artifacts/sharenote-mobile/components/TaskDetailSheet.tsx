import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { AppTask, FamilyMember } from '@/context/AppState';
import { useColors } from '@/hooks/useColors';
import { MemberAvatar } from '@/components/MemberAvatar';
import { getAssignedMembers } from '@/utils/assignments';

type TaskDetailSheetProps = {
  task: AppTask | null;
  members: FamilyMember[];
  visible: boolean;
  canManage?: boolean;
  onClose: () => void;
  onEdit: (task: AppTask) => void;
  onDelete: (task: AppTask) => void;
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTaskDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function formatTaskDateRange(task: AppTask) {
  if (!task.endDate || task.endDate === task.date) return formatTaskDate(task.date);
  return `${formatTaskDate(task.date)} - ${formatTaskDate(task.endDate)}`;
}

export function TaskDetailSheet({
  task,
  members,
  visible,
  canManage = false,
  onClose,
  onEdit,
  onDelete,
}: TaskDetailSheetProps) {
  const colors = useColors();
  const assignedMembers = task ? getAssignedMembers(task, members) : [];

  if (!task) return null;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          onPress={() => null}
        >
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="check-square" size={22} color={colors.primaryStrong} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.eyebrow, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
                Task
              </Text>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                {task.title}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={[styles.infoPanel, { backgroundColor: colors.cardSoft }]}>
            <View style={[styles.colorRail, { backgroundColor: task.color }]} />
            <View style={styles.detailRow}>
              <Feather name="calendar" size={18} color={colors.primaryStrong} />
              <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {formatTaskDateRange(task)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="clock" size={18} color={colors.primaryStrong} />
              <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {task.time || 'No time set'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={18} color={colors.primaryStrong} />
              <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {task.location}
              </Text>
            </View>
            <View style={styles.detailRow}>
              {assignedMembers.length ? (
                <View style={styles.assignedAvatars}>
                  {assignedMembers.slice(0, 3).map((member) => (
                    <MemberAvatar key={member.id} member={member} size={28} />
                  ))}
                </View>
              ) : (
                <Feather name="user" size={18} color={colors.primaryStrong} />
              )}
              <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                {assignedMembers.length ? assignedMembers.map((member) => member.name).join(', ') : 'Unassigned'}
              </Text>
            </View>
            {task.repeat && task.repeat !== 'None' ? (
              <View style={styles.detailRow}>
                <Feather name="repeat" size={18} color={colors.primaryStrong} />
                <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Repeats {task.repeat.toLowerCase()}
                </Text>
              </View>
            ) : null}
            {task.details?.trim() ? (
              <View style={styles.detailRow}>
                <Feather name="align-left" size={18} color={colors.primaryStrong} />
                <Text style={[styles.detailText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  {task.details.trim()}
                </Text>
              </View>
            ) : null}
          </View>

          {canManage ? (
            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={`Edit ${task.title}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  onEdit(task);
                }}
                style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              >
                <Feather name="edit-2" size={20} color={colors.primaryStrong} />
              </Pressable>
              <Pressable
                accessibilityLabel={`Delete ${task.title}`}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  onDelete(task);
                }}
                style={[styles.actionButton, { backgroundColor: colors.accentDangerSoft }]}
              >
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 28,
    padding: 20,
    gap: 18,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 24 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  infoPanel: {
    borderRadius: 20,
    padding: 16,
    paddingLeft: 20,
    gap: 14,
    overflow: 'hidden',
  },
  colorRail: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assignedAvatars: { flexDirection: 'row', gap: 6 },
  detailText: { flex: 1, fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
