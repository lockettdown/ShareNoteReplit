import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAppState } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';

export default function AddEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { members, addEvent } = useAppState();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [personId, setPersonId] = useState(members[0].id);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleSave() {
    if (!title.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEvent({
      title: title.trim(),
      date: date.trim() || '2025-08-12',
      time: [starts.trim(), ends.trim()].filter(Boolean).join(' - ') || 'No time set',
      personId,
      color: members.find(m => m.id === personId)?.color || colors.primary,
    });
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerLeft}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
          Add Event
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
        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Event Title</Text>
            <View style={styles.inputContainer}>
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

        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Date</Text>
            <View style={styles.inputContainer}>
              <Feather name="calendar" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="mm/dd/yyyy"
                placeholderTextColor={colors.mutedForeground}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
          
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Starts</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                  placeholder="--:-- --"
                  placeholderTextColor={colors.mutedForeground}
                  value={starts}
                  onChangeText={setStarts}
                />
              </View>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Ends</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                  placeholder="--:-- --"
                  placeholderTextColor={colors.mutedForeground}
                  value={ends}
                  onChangeText={setEnds}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Assign To</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assignRow}>
              <Pressable style={[styles.addAssignBtn, { borderColor: '#e8e0f7', borderStyle: 'dashed' }]}>
                <Feather name="plus" size={20} color={colors.mutedForeground} />
              </Pressable>
              {members.map(m => (
                <Pressable key={m.id} onPress={() => { Haptics.selectionAsync(); setPersonId(m.id); }}>
                  <MemberAvatar member={m} selected={personId === m.id} borderWidth={0} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Reminder</Text>
            <Pressable style={styles.dropdownContainer}>
              <Text style={[styles.dropdownText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>At time of event</Text>
              <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Second Reminder</Text>
            <Pressable style={styles.dropdownContainer}>
              <Text style={[styles.dropdownText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>At time of event</Text>
              <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Repeat</Text>
            <Pressable style={styles.dropdownContainer}>
              <Text style={[styles.dropdownText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>None</Text>
              <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Notes</Text>
            <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start', paddingTop: 16 }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular', height: '100%', textAlignVertical: 'top' }]}
                placeholder="Add any details..."
                placeholderTextColor={colors.mutedForeground}
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
            Save Event
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 40 },
  headerRight: { width: 40 },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 16 },
  card: { borderRadius: 24, padding: 20, gap: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#e8e0f7', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  rowFields: { flexDirection: 'row', gap: 16 },
  assignRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  addAssignBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dropdownContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#e8e0f7', paddingHorizontal: 16 },
  dropdownText: { fontSize: 15 },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
  saveButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 16 },
});