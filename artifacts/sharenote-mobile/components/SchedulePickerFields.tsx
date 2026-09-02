import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

type SchedulePickerFieldsProps = {
  date: string;
  onDateChange: (value: string) => void;
  endDate?: string;
  onEndDateChange?: (value: string) => void;
  starts: string;
  onStartsChange: (value: string) => void;
  ends: string;
  onEndsChange: (value: string) => void;
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
const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

type TimeTarget = 'starts' | 'ends';
type DateTarget = 'date' | 'endDate';

function parseDisplayDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return new Date(2025, 7, 12);
  return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
}

function formatDate(year: number, month: number, day: number) {
  return `${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

function parseTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return { hour: '7', minute: '00', period: 'PM' };
  return { hour: match[1], minute: match[2], period: match[3] };
}

export function normalizePickedDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return value.trim() || '2025-08-12';
  return `${match[3]}-${match[1]}-${match[2]}`;
}

function compareDisplayDates(first: string, second: string) {
  return parseDisplayDate(first).getTime() - parseDisplayDate(second).getTime();
}

export function SchedulePickerFields({
  date,
  onDateChange,
  endDate,
  onEndDateChange,
  starts,
  onStartsChange,
  ends,
  onEndsChange,
}: SchedulePickerFieldsProps) {
  const colors = useColors();
  const initialMonth = parseDisplayDate(date);
  const [visiblePicker, setVisiblePicker] = useState<DateTarget | TimeTarget | null>(null);
  const [monthDate, setMonthDate] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );
  const [draftTime, setDraftTime] = useState(parseTime(''));

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

  function openTimePicker(target: TimeTarget) {
    setDraftTime(parseTime(target === 'starts' ? starts : ends));
    setVisiblePicker(target);
  }

  function openDatePicker(target: DateTarget) {
    const selectedDate = target === 'endDate' ? endDate : date;
    if (selectedDate) {
      const nextMonth = parseDisplayDate(selectedDate);
      setMonthDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
    }
    setVisiblePicker(target);
  }

  function updateMonth(offset: number) {
    Haptics.selectionAsync();
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(day: number) {
    const nextDate = formatDate(monthDate.getFullYear(), monthDate.getMonth(), day);
    Haptics.selectionAsync();
    if (visiblePicker === 'endDate' && onEndDateChange) {
      if (date && compareDisplayDates(nextDate, date) < 0) {
        onDateChange(nextDate);
        onEndDateChange(date);
      } else {
        onEndDateChange(nextDate);
      }
    } else {
      onDateChange(nextDate);
      if (endDate && onEndDateChange && compareDisplayDates(endDate, nextDate) < 0) {
        onEndDateChange(nextDate);
      }
    }
    setVisiblePicker(null);
  }

  function confirmTime() {
    const nextTime = `${draftTime.hour}:${draftTime.minute} ${draftTime.period}`;
    if (visiblePicker === 'starts') onStartsChange(nextTime);
    if (visiblePicker === 'ends') onEndsChange(nextTime);
    Haptics.selectionAsync();
    setVisiblePicker(null);
  }

  function timeOptionGroup(values: string[], selected: string, keyName: 'hour' | 'minute' | 'period') {
    return (
      <View style={styles.optionGrid}>
        {values.map((value) => {
          const isSelected = value === selected;
          return (
            <Pressable
              key={value}
              onPress={() => {
                Haptics.selectionAsync();
                setDraftTime((current) => ({ ...current, [keyName]: value }));
              }}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.secondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  {
                    color: isSelected ? '#ffffff' : colors.foreground,
                    fontFamily: 'Inter_600SemiBold',
                  },
                ]}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <>
      <View style={styles.rowFields}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Starts Date
          </Text>
          <Pressable
            onPress={() => openDatePicker('date')}
            style={[styles.inputContainer, { borderColor: colors.border }]}
          >
            <Feather name="calendar" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
            <Text
              style={[
                styles.inputValue,
                {
                  color: date ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
            >
              {date || 'mm/dd/yyyy'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Ends Date
          </Text>
          <Pressable
            onPress={() => openDatePicker('endDate')}
            style={[styles.inputContainer, { borderColor: colors.border }]}
          >
            <Feather name="calendar" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
            <Text
              style={[
                styles.inputValue,
                {
                  color: endDate ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
              numberOfLines={1}
            >
              {endDate || 'Optional'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.rowFields}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Starts
          </Text>
          <Pressable
            onPress={() => openTimePicker('starts')}
            style={[styles.inputContainer, { borderColor: colors.border }]}
          >
            <Text
              style={[
                styles.inputValue,
                {
                  color: starts ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
            >
              {starts || '--:-- --'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Ends
          </Text>
          <Pressable
            onPress={() => openTimePicker('ends')}
            style={[styles.inputContainer, { borderColor: colors.border }]}
          >
            <Text
              style={[
                styles.inputValue,
                {
                  color: ends ? colors.foreground : colors.mutedForeground,
                  fontFamily: 'Inter_400Regular',
                },
              ]}
            >
              {ends || '--:-- --'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={visiblePicker !== null}
        onRequestClose={() => setVisiblePicker(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setVisiblePicker(null)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => null}
          >
            {visiblePicker === 'date' || visiblePicker === 'endDate' ? (
              <>
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
                    const selectedValue = visiblePicker === 'endDate' ? endDate : date;
                    const selected = day
                      ? selectedValue === formatDate(monthDate.getFullYear(), monthDate.getMonth(), day)
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
              </>
            ) : (
              <>
                <Text style={[styles.sheetTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
                  {visiblePicker === 'starts' ? 'Start Time' : 'End Time'}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeScroller}>
                  <Text style={[styles.groupTitle, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                    Hour
                  </Text>
                  {timeOptionGroup(HOURS, draftTime.hour, 'hour')}
                  <Text style={[styles.groupTitle, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                    Minute
                  </Text>
                  {timeOptionGroup(MINUTES, draftTime.minute, 'minute')}
                  <Text style={[styles.groupTitle, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                    AM or PM
                  </Text>
                  {timeOptionGroup(PERIODS, draftTime.period, 'period')}
                </ScrollView>
                <Pressable
                  onPress={confirmTime}
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.confirmText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>
                    Set Time
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  inputValue: { flex: 1, fontSize: 15 },
  rowFields: { flexDirection: 'row', gap: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '82%',
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
  timeScroller: { paddingTop: 18, paddingBottom: 12, gap: 10 },
  groupTitle: { fontSize: 12, textTransform: 'uppercase' },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    minWidth: 58,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  optionText: { fontSize: 15 },
  confirmButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmText: { fontSize: 16 },
});
