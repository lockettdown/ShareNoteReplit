import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

type WeeklyRepeatEndControlsProps = {
  repeatEndsOn: string;
  onRepeatEndsOnChange: (value: string) => void;
  repeatOccurrences: string;
  onRepeatOccurrencesChange: (value: string) => void;
  error?: string;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseDisplayDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return new Date(2025, 7, 12);
  return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
}

function formatDate(year: number, month: number, day: number) {
  return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

export function canonicalToPickedDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

export function WeeklyRepeatEndControls({
  repeatEndsOn,
  onRepeatEndsOnChange,
  repeatOccurrences,
  onRepeatOccurrencesChange,
  error,
}: WeeklyRepeatEndControlsProps) {
  const colors = useColors();
  const initialMonth = parseDisplayDate(repeatEndsOn);
  const [monthDate, setMonthDate] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const leadingBlanks = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [monthDate]);

  function openCalendar() {
    if (repeatEndsOn) {
      const selectedDate = parseDisplayDate(repeatEndsOn);
      setMonthDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
    setCalendarOpen(true);
  }

  function updateMonth(offset: number) {
    Haptics.selectionAsync();
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(day: number) {
    Haptics.selectionAsync();
    onRepeatEndsOnChange(formatDate(monthDate.getFullYear(), monthDate.getMonth(), day));
    setCalendarOpen(false);
  }

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.cardSoft }]}>
      <Text style={[styles.title, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
        Weekly Repeat Ends
      </Text>
      <Text style={[styles.helper, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
        Choose an end date or enter the number of weekly occurrences.
      </Text>

      <View style={styles.rowFields}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            End Date
          </Text>
          <Pressable
            onPress={openCalendar}
            style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="calendar" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
            <Text
              style={[
                styles.inputValue,
                {
                  color: repeatEndsOn ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
              numberOfLines={1}
            >
              {repeatEndsOn || 'Optional'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Occurrences
          </Text>
          <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              placeholder="Optional"
              placeholderTextColor={colors.mutedForeground}
              value={repeatOccurrences}
              onChangeText={onRepeatOccurrencesChange}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>
          {error}
        </Text>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={calendarOpen}
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setCalendarOpen(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => null}
          >
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => updateMonth(-1)} style={styles.iconButton}>
                <Feather name="chevron-left" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.sheetTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
                {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
              </Text>
              <Pressable onPress={() => updateMonth(1)} style={styles.iconButton}>
                <Feather name="chevron-right" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((weekday, index) => (
                <Text
                  key={`${weekday}-${index}`}
                  style={[styles.weekday, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}
                >
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const selected = day
                  ? repeatEndsOn === formatDate(monthDate.getFullYear(), monthDate.getMonth(), day)
                  : false;
                return day ? (
                  <Pressable
                    key={`${day}-${index}`}
                    onPress={() => selectDate(day)}
                    style={styles.dayCell}
                  >
                    <View style={[styles.dayButton, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: selected ? '#ffffff' : colors.foreground,
                            fontFamily: 'Inter_600SemiBold',
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                ) : (
                  <View key={`blank-${index}`} style={styles.dayCell} />
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  title: { fontSize: 14 },
  helper: { fontSize: 13, lineHeight: 18 },
  rowFields: { flexDirection: 'row', gap: 12 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 13 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  inputValue: { flex: 1, fontSize: 14 },
  textInput: { flex: 1, fontSize: 14 },
  errorText: { fontSize: 12, lineHeight: 17 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    padding: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 15 },
});
