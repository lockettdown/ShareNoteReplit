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
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';

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

function toCanonicalDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  const { events, members } = useAppState();

  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(7); // August
  const [selectedDay, setSelectedDay] = useState(12);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const grid = buildCalendarGrid(viewYear, viewMonth);

  const selectedDate = toCanonicalDate(viewYear, viewMonth, selectedDay);
  const displayEvents = events
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const selectedDateLabel = `Events for ${MONTH_NAMES[viewMonth].substring(0, 3)} ${selectedDay}`;

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerLeft}>
          <MemberAvatar member={members[0]} size={32} headerPhoto />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Calendar
        </Text>
        <Pressable style={styles.headerRight}>
          <Feather name="bell" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.calendarCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
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
                  const isToday = viewYear === 2025 && viewMonth === 7 && day === 26; // hardcoded to match figma

                  // Mock dots to match Figma: 2 has blue dot, 5 has green+yellow, 12 has blue+green+purple, 15 has pink, 23 has purple, 26 has orange
                  const getDots = (d: number | null) => {
                    if (d === 2) return ['#3b82f6'];
                    if (d === 5) return ['#059669', '#eab308'];
                    if (d === 12) return ['#3b82f6', '#059669', '#8b5cf6'];
                    if (d === 15) return ['#e11d48'];
                    if (d === 23) return ['#8b5cf6'];
                    if (d === 26) return ['#f59e0b'];
                    return [];
                  };
                  const dots = getDots(day);

                  return (
                    <Pressable
                      key={di}
                      style={styles.dayCell}
                      onPress={() => day && setSelectedDay(day)}
                    >
                      {day !== null && (
                        <View style={[
                          styles.dayBackground,
                          isSelected && { backgroundColor: '#f4f0ff' },
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

          {displayEvents.map((evt) => {
            const person = members.find(m => m.id === evt.personId);
            return (
              <View key={evt.id} style={[styles.eventCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
                <View style={[styles.cardLeftBorder, { backgroundColor: evt.color }]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTime, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    {evt.time}
                  </Text>
                  <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    {evt.title}
                  </Text>
                </View>
                {person && <MemberAvatar member={person} size={36} />}
              </View>
            );
          })}
          {displayEvents.length === 0 && (
            <Text style={[styles.emptyState, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              No events scheduled for this day.
            </Text>
          )}
        </View>
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
  sectionTitle: { fontSize: 22, letterSpacing: -0.5 },
  eventCard: {
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', padding: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    overflow: 'hidden',
  },
  cardLeftBorder: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 4, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  eventContent: { flex: 1, paddingLeft: 8, gap: 4 },
  eventTime: { fontSize: 13 },
  eventTitle: { fontSize: 16 },
  emptyState: { fontSize: 15, textAlign: 'center', paddingVertical: 12 },
});