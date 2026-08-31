import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppState } from '@/context/AppState';
import { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { familyName, setFamilyName } = useAppState();
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const handleSignOut = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.replace('/'); };
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { paddingTop: topPad + 12 }]}>
      <Pressable onPress={() => router.back()} style={styles.headerLeft}><Feather name="arrow-left" size={24} color={colors.foreground} /></Pressable>
      <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Settings</Text><View style={styles.headerRight} />
    </View>
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
        <Text style={[styles.cardHeading, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Family Identity</Text>
        <View style={styles.inputContainer}><TextInput testID="family-name-input" value={familyName} onChangeText={setFamilyName} style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]} placeholderTextColor={colors.mutedForeground} /></View>
      </View>
      <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
        <Text style={[styles.cardHeading, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Appearance</Text>
        <Text style={[styles.cardDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Choose your preferred theme for the app.</Text>
        <View style={[styles.toggle, { backgroundColor: '#f0ecff' }]}>
          <Pressable testID="light-mode-btn" style={[styles.toggleOption, appearance === 'light' && [styles.toggleOptionActive, { backgroundColor: '#fff', shadowColor: colors.primary }]]} onPress={() => { Haptics.selectionAsync(); setAppearance('light'); }}>
            <Feather name="sun" size={16} color={appearance === 'light' ? colors.primary : colors.mutedForeground} /><Text style={[styles.toggleOptionText, { color: appearance === 'light' ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Light Mode</Text>
          </Pressable>
          <Pressable testID="dark-mode-btn" style={[styles.toggleOption, appearance === 'dark' && [styles.toggleOptionActive, { backgroundColor: '#fff', shadowColor: colors.primary }]]} onPress={() => { Haptics.selectionAsync(); setAppearance('dark'); }}>
            <Feather name="moon" size={16} color={appearance === 'dark' ? colors.primary : colors.mutedForeground} /><Text style={[styles.toggleOptionText, { color: appearance === 'dark' ? colors.primary : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Dark Mode</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
        <Text style={[styles.cardHeading, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Account</Text>
        <Pressable style={styles.accountRow} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}><View style={[styles.accountRowIcon, { backgroundColor: '#f9f8ff' }]}><Feather name="user" size={16} color={colors.primary} /></View><Text style={[styles.accountRowLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Profile Settings</Text><Feather name="chevron-right" size={16} color={colors.mutedForeground} /></Pressable>
        <View style={[styles.divider, { backgroundColor: '#f0ecff' }]} />
        <Pressable style={styles.accountRow} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}><View style={[styles.accountRowIcon, { backgroundColor: '#f9f8ff' }]}><Feather name="shield" size={16} color={colors.primary} /></View><Text style={[styles.accountRowLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Privacy</Text><Feather name="chevron-right" size={16} color={colors.mutedForeground} /></Pressable>
        <View style={[styles.divider, { backgroundColor: '#f0ecff' }]} />
        <Pressable style={styles.accountRow} onPress={handleSignOut}><View style={[styles.accountRowIcon, { backgroundColor: '#fff1f2' }]}><Feather name="log-out" size={16} color="#e11d48" /></View><Text style={[styles.accountRowLabel, { color: '#e11d48', fontFamily: 'Inter_500Medium' }]}>Sign Out</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 }, headerLeft: { width: 40 }, headerRight: { width: 40 }, headerTitle: { fontSize: 20 }, scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  card: { borderRadius: 24, padding: 24, gap: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, cardHeading: { fontSize: 20 }, cardDescription: { fontSize: 15, lineHeight: 22 }, inputContainer: { height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#e8e0f7', paddingHorizontal: 16, justifyContent: 'center' }, input: { fontSize: 16 },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 }, toggleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 }, toggleOptionActive: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }, toggleOptionText: { fontSize: 14 }, accountRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 }, accountRowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, accountRowLabel: { flex: 1, fontSize: 16 }, divider: { height: 1, marginLeft: 56 },
});