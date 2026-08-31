import {
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
import { useAppState } from '@/context/AppState';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { tasks, members, toggleTask } = useAppState();
  const [showCompleted, setShowCompleted] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const pending = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerLeft}>
          <MemberAvatar member={members[0]} size={32} headerPhoto />
        </View>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
          Tasks
        </Text>
        <Pressable style={styles.headerRight}>
          <Feather name="bell" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Today's Tasks</Text>
          <Pressable
            testID="add-task-button"
            accessibilityLabel="Add task"
            style={[styles.addBtn, { borderColor: colors.primary }]}
            onPress={() => router.push('/add-task')}
          >
            <Feather name="plus" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.tasksList}>
          {pending.map(task => {
            const person = members.find(m => m.id === task.personId);
            return (
              <Pressable
                key={task.id}
                testID={`task-${task.id}`}
                accessibilityLabel={`${task.done ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                style={[styles.taskCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTask(task.id); }}
              >
                <View style={[styles.cardLeftBorder, { backgroundColor: task.color }]} />
                <View style={[styles.checkbox, task.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {task.done && <Feather name="check" size={14} color="#fff" />}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold', textDecorationLine: task.done ? 'line-through' : 'none' }]}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Feather name="clock" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.taskMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                      {task.time} • {task.location}
                    </Text>
                  </View>
                </View>
                {person && <MemberAvatar member={person} size={36} />}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="completed-tasks-toggle"
          accessibilityLabel={`${showCompleted ? 'Hide' : 'View'} completed tasks`}
          accessibilityState={{ expanded: showCompleted }}
          style={styles.accordion}
          onPress={() => setShowCompleted((visible) => !visible)}
        >
          <Feather name={showCompleted ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
          <Text style={[styles.accordionText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>View Completed</Text>
        </Pressable>

        {showCompleted && (
          <View style={styles.tasksList}>
            {done.map(task => {
              const person = members.find(m => m.id === task.personId);
              return (
                <Pressable
                  key={task.id}
                  testID={`completed-task-${task.id}`}
                  accessibilityLabel={`Mark incomplete: ${task.title}`}
                  style={[styles.taskCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTask(task.id); }}
                >
                  <View style={[styles.cardLeftBorder, { backgroundColor: task.color }]} />
                  <View style={[styles.checkbox, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Feather name="check" size={14} color="#fff" />
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold', textDecorationLine: 'line-through' }]}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <Feather name="clock" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.taskMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                        {task.time} • {task.location}
                      </Text>
                    </View>
                  </View>
                  {person && <MemberAvatar member={person} size={36} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 24, letterSpacing: -0.6 },
  addBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tasksList: { gap: 16 },
  taskCard: {
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 20, paddingLeft: 24, gap: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    overflow: 'hidden',
  },
  cardLeftBorder: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: '#e8e0f7', alignItems: 'center', justifyContent: 'center' },
  taskContent: { flex: 1, gap: 6 },
  taskTitle: { fontSize: 16 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskMetaText: { fontSize: 13 },
  accordion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  accordionText: { fontSize: 16 },
});