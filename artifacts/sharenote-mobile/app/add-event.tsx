import {
  Modal,
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
import type { AppEvent, RepeatOption } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';
import { normalizePickedDate, SchedulePickerFields } from '@/components/SchedulePickerFields';
import { FormDropdownField } from '@/components/FormDropdownField';
import { WeeklyRepeatEndControls } from '@/components/WeeklyRepeatEndControls';
import { PermissionNotice } from '@/components/PermissionNotice';
import { parseCanonicalDate, toCanonicalDate } from '@/utils/schedule';

const REMINDER_OPTIONS = ['At time of event', '5 minutes before', '10 minutes before', '15 minutes before', '30 minutes before', '1 hour before', '1 day before', '1 week before'];
const SECOND_REMINDER_OPTIONS = ['None', ...REMINDER_OPTIONS];
const REPEAT_OPTIONS: RepeatOption[] = ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

function canonicalToPickedDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function daysBetweenCanonical(start: string, end: string) {
  const startDate = parseCanonicalDate(start);
  const endDate = parseCanonicalDate(end);
  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

function addDaysCanonical(value: string, days: number) {
  const date = parseCanonicalDate(value);
  date.setDate(date.getDate() + days);
  return toCanonicalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function splitEventTime(value: string) {
  if (!value || value === 'No time set') return ['', ''];
  const parts = value.split(' - ');
  return [parts[0] ?? '', parts[1] ?? ''] as const;
}

type EventDraft = Omit<AppEvent, 'id'>;

export default function AddEventScreen() {
  const router = useRouter();
  const { personId: initialPersonId, editEventId, occurrenceDate } = useLocalSearchParams<{ personId?: string; editEventId?: string; occurrenceDate?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { members, dashboardMembers, events, dashboardEvents, canManageFamily, addEvent, updateEvent, updateRecurringEventOccurrence } = useAppState();
  const assignableMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const existingEvent = [...events, ...dashboardEvents].find((event) => event.id === editEventId);
  const [initialStartTime, initialEndTime] = splitEventTime(existingEvent?.time ?? '');
  const isEditingRecurringEvent = Boolean(existingEvent?.repeat && existingEvent.repeat !== 'None');
  const initialOccurrenceDate = isEditingRecurringEvent && occurrenceDate ? occurrenceDate : existingEvent?.date;
  const initialDurationDays = existingEvent?.endDate ? daysBetweenCanonical(existingEvent.date, existingEvent.endDate) : 0;
  const initialDate = existingEvent && initialOccurrenceDate ? initialOccurrenceDate : existingEvent?.date;
  const initialEndDate = existingEvent?.endDate && initialOccurrenceDate
    ? addDaysCanonical(initialOccurrenceDate, initialDurationDays)
    : existingEvent?.endDate;
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
  const [date, setDate] = useState(initialDate ? canonicalToPickedDate(initialDate) : '');
  const [endDate, setEndDate] = useState(initialEndDate ? canonicalToPickedDate(initialEndDate) : '');
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
  const [pendingEvent, setPendingEvent] = useState<EventDraft | null>(null);
  const [showRecurringScopeChoice, setShowRecurringScopeChoice] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function closeScreen() {
    router.replace('/(tabs)/calendar');
  }

  function getSeriesScopedEvent(nextEvent: EventDraft) {
    if (!existingEvent || !isEditingRecurringEvent || !initialOccurrenceDate || initialOccurrenceDate === existingEvent.date) {
      return nextEvent;
    }

    return {
      ...nextEvent,
      date: nextEvent.date === initialOccurrenceDate ? existingEvent.date : nextEvent.date,
      endDate: nextEvent.endDate === initialEndDate ? existingEvent.endDate : nextEvent.endDate,
    };
  }

  function commitEvent(nextEvent: EventDraft, scope: 'this' | 'series' = 'series') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (existingEvent) {
      if (scope === 'this') {
        updateRecurringEventOccurrence(existingEvent.id, initialOccurrenceDate ?? existingEvent.date, nextEvent);
      } else {
        updateEvent(existingEvent.id, getSeriesScopedEvent(nextEvent));
      }
    } else {
      addEvent(nextEvent);
    }
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

    if (existingEvent && isEditingRecurringEvent) {
      setPendingEvent(nextEvent);
      setShowRecurringScopeChoice(true);
      return;
    }

    commitEvent(nextEvent);
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

      <Modal
        visible={showRecurringScopeChoice}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecurringScopeChoice(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRecurringScopeChoice(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Apply Changes
              </Text>
              <Pressable onPress={() => setShowRecurringScopeChoice(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              This event repeats. Choose how much of the series should change.
            </Text>

            <Pressable
              style={[styles.modalOption, { borderColor: colors.border }]}
              onPress={() => {
                if (!pendingEvent) return;
                setShowRecurringScopeChoice(false);
                commitEvent(pendingEvent, 'this');
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  This event only
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Update only this occurrence. The rest of the series stays unchanged.
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.modalOption, { borderColor: colors.border }]}
              onPress={() => {
                if (!pendingEvent) return;
                setShowRecurringScopeChoice(false);
                commitEvent(pendingEvent, 'series');
              }}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="repeat" size={20} color={colors.primary} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={[styles.modalOptionTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  Entire series
                </Text>
                <Text style={[styles.modalOptionSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Update this event and all occurrences in the recurring series.
                </Text>
              </View>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 24 },
  modalDescription: { fontSize: 15, lineHeight: 22 },
  modalOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  modalOptionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalOptionTextWrapper: { flex: 1, gap: 4 },
  modalOptionTitle: { fontSize: 16 },
  modalOptionSubtitle: { fontSize: 13, lineHeight: 18 },
  restrictedContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
});
