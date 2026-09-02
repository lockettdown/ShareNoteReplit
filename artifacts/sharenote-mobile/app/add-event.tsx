import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAppState } from '@/context/AppState';
import type { RepeatOption } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';
import { normalizePickedDate, SchedulePickerFields } from '@/components/SchedulePickerFields';
import { FormDropdownField } from '@/components/FormDropdownField';
import { WeeklyRepeatEndControls } from '@/components/WeeklyRepeatEndControls';
import { PermissionNotice } from '@/components/PermissionNotice';

const REMINDER_OPTIONS = ['At time of event', '5 minutes before', '10 minutes before', '15 minutes before', '30 minutes before', '1 hour before', '1 day before', '1 week before'];
const SECOND_REMINDER_OPTIONS = ['None', ...REMINDER_OPTIONS];
const REPEAT_OPTIONS: RepeatOption[] = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

function canonicalToPickedDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function splitEventTime(value: string) {
  if (!value || value === 'No time set') return ['', ''];
  const parts = value.split(' - ');
  return [parts[0] ?? '', parts[1] ?? ''] as const;
}

export default function AddEventScreen() {
  const router = useRouter();
  const { personId: initialPersonId, editEventId } = useLocalSearchParams<{ personId?: string; editEventId?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { members, dashboardMembers, events, dashboardEvents, canManageFamily, addEvent, updateEvent } = useAppState();
  const assignableMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const existingEvent = [...events, ...dashboardEvents].find((event) => event.id === editEventId);
  const [initialStartTime, initialEndTime] = splitEventTime(existingEvent?.time ?? '');
  const initialSelectedPersonIds = existingEvent?.personIds?.length
    ? existingEvent.personIds
    : [
        assignableMembers.find((member) => member.id === (existingEvent?.personId ?? initialPersonId))?.id ??
        assignableMembers[0].id,
      ];
  const initialSelectedPersonId =
    assignableMembers.find((member) => member.id === (existingEvent?.personId ?? initialPersonId))?.id ??
    assignableMembers[0].id;

  const [title, setTitle] = useState(existingEvent?.title ?? '');
  const [date, setDate] = useState(existingEvent ? canonicalToPickedDate(existingEvent.date) : '');
  const [endDate, setEndDate] = useState(existingEvent?.endDate ? canonicalToPickedDate(existingEvent.endDate) : '');
  const [starts, setStarts] = useState(initialStartTime);
  const [ends, setEnds] = useState(initialEndTime);
  const [details, setDetails] = useState(existingEvent?.details ?? '');
  const [personIds, setPersonIds] = useState(initialSelectedPersonIds);
  const [reminder, setReminder] = useState(REMINDER_OPTIONS[0]);
  const [secondReminder, setSecondReminder] = useState(REMINDER_OPTIONS[0]);
  const [repeat, setRepeat] = useState(existingEvent?.repeat ?? REPEAT_OPTIONS[0]);
  const [repeatEndsOn, setRepeatEndsOn] = useState(existingEvent?.repeatEndsOn ? canonicalToPickedDate(existingEvent.repeatEndsOn) : '');
  const [repeatOccurrences, setRepeatOccurrences] = useState(existingEvent?.repeatOccurrences ? String(existingEvent.repeatOccurrences) : '');
  const [weeklyRepeatError, setWeeklyRepeatError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'reminder' | 'secondReminder' | 'repeat' | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function closeScreen() {
    router.replace('/(tabs)/calendar');
  }

  function handleSave() {
    if (!title.trim()) return;
    const trimmedRepeatOccurrences = repeatOccurrences.trim();
    const parsedRepeatOccurrences = Number.parseInt(trimmedRepeatOccurrences, 10);
    const hasRepeatEndDate = repeatEndsOn.trim().length > 0;
    const hasRepeatOccurrences = trimmedRepeatOccurrences.length > 0;

    if (repeat === 'Weekly') {
      if (!hasRepeatEndDate && !hasRepeatOccurrences) {
        setWeeklyRepeatError('Set an end date or number of occurrences for weekly repeats.');
        return;
      }
      if (hasRepeatOccurrences && (!/^\d+$/.test(trimmedRepeatOccurrences) || !Number.isFinite(parsedRepeatOccurrences) || parsedRepeatOccurrences < 1)) {
        setWeeklyRepeatError('Occurrences must be 1 or more.');
        return;
      }
    }

    const selectedPersonIds = personIds.length ? personIds : [initialSelectedPersonId];
    const primaryPersonId = selectedPersonIds[0];

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextEvent = {
      title: title.trim(),
      date: normalizePickedDate(date),
      endDate: endDate.trim() ? normalizePickedDate(endDate) : undefined,
      repeat,
      repeatEndsOn: repeat === 'Weekly' && hasRepeatEndDate ? normalizePickedDate(repeatEndsOn) : undefined,
      repeatOccurrences: repeat === 'Weekly' && hasRepeatOccurrences ? parsedRepeatOccurrences : undefined,
      time: [starts.trim(), ends.trim()].filter(Boolean).join(' - ') || 'No time set',
      personId: primaryPersonId,
      personIds: selectedPersonIds,
      color: assignableMembers.find(m => m.id === primaryPersonId)?.color || colors.primary,
      details: details.trim(),
    };

    if (existingEvent) {
      updateEvent(existingEvent.id, nextEvent);
    } else {
      addEvent(nextEvent);
    }
    router.replace('/(tabs)/calendar');
  }

  function toggleAssignedPerson(nextPersonId: string) {
    Haptics.selectionAsync();
    setPersonIds((current) => {
      if (current.includes(nextPersonId)) {
        return current.length > 1 ? current.filter((id) => id !== nextPersonId) : current;
      }
      return [...current, nextPersonId];
    });
  }

  if (!canManageFamily) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Pressable onPress={closeScreen} style={styles.headerLeft} hitSlop={12}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
            Events
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={[styles.restrictedContent, { paddingBottom: bottomPad + 32 }]}>
          <PermissionNotice
            title="Parent Permission Required"
            message="This profile can view events and tasks, but cannot create or edit events."
            actionLabel="Back to Calendar"
            onAction={closeScreen}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={closeScreen} style={styles.headerLeft} hitSlop={12}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          {existingEvent ? 'Edit Event' : 'Add Event'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Event Title</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="e.g. Soccer Practice"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <SchedulePickerFields
            date={date}
            onDateChange={setDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            starts={starts}
            onStartsChange={setStarts}
            ends={ends}
            onEndsChange={setEnds}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Assign To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignRow}>
              <Pressable style={[styles.addAssignBtn, { borderColor: colors.border, borderStyle: 'dashed' }]}>
                <Feather name="plus" size={20} color={colors.mutedForeground} />
              </Pressable>
              {assignableMembers.map(m => (
                <Pressable
                  key={m.id}
                  accessibilityLabel={`${personIds.includes(m.id) ? 'Unassign' : 'Assign'} ${m.name}`}
                  accessibilityState={{ selected: personIds.includes(m.id) }}
                  onPress={() => toggleAssignedPerson(m.id)}
                >
                  <MemberAvatar member={m} selected={personIds.includes(m.id)} borderWidth={0} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <FormDropdownField
            label="Reminder"
            value={reminder}
            options={REMINDER_OPTIONS}
            open={openDropdown === 'reminder'}
            onOpenChange={(open) => setOpenDropdown(open ? 'reminder' : null)}
            onChange={setReminder}
          />
          <FormDropdownField
            label="Second Reminder"
            value={secondReminder}
            options={SECOND_REMINDER_OPTIONS}
            open={openDropdown === 'secondReminder'}
            onOpenChange={(open) => setOpenDropdown(open ? 'secondReminder' : null)}
            onChange={setSecondReminder}
          />
          <FormDropdownField
            label="Repeat"
            value={repeat}
            options={REPEAT_OPTIONS}
            open={openDropdown === 'repeat'}
            onOpenChange={(open) => setOpenDropdown(open ? 'repeat' : null)}
            onChange={(value) => {
              setRepeat(value);
              setWeeklyRepeatError('');
            }}
          />
          {repeat === 'Weekly' ? (
            <WeeklyRepeatEndControls
              repeatEndsOn={repeatEndsOn}
              onRepeatEndsOnChange={(value) => {
                setRepeatEndsOn(value);
                setWeeklyRepeatError('');
              }}
              repeatOccurrences={repeatOccurrences}
              onRepeatOccurrencesChange={(value) => {
                setRepeatOccurrences(value);
                setWeeklyRepeatError('');
              }}
              error={weeklyRepeatError}
            />
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Notes</Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, height: 120, alignItems: 'flex-start', paddingTop: 16 }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular', height: '100%', textAlignVertical: 'top' }]}
                placeholder="Add any details..."
                placeholderTextColor={colors.mutedForeground}
                value={details}
                onChangeText={setDetails}
                multiline
              />
            </View>
          </View>
        </View>

      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: bottomPad + 16, backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>
            {existingEvent ? 'Update Event' : 'Save Event'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerRight: { width: 40 },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  card: { borderRadius: 24, padding: 20, gap: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15 },
  assignRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  addAssignBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
  saveButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 16 },
  restrictedContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
});
