import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PermissionNotice } from '@/components/PermissionNotice';
import { useAppState } from '@/context/AppState';
import { useColors } from '@/hooks/useColors';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    familyName,
    familyEmail,
    activeProfile,
    canManageFamily,
    setFamilyName,
    clearActiveProfile,
    signOut,
  } = useAppState();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleSwitchProfile() {
    Haptics.selectionAsync();
    clearActiveProfile();
    router.replace('/profile-select');
  }

  function handleSignOut() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void signOut();
    router.replace('/');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerLeft}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {!canManageFamily ? (
          <>
            <PermissionNotice
              title="Parent Permission Required"
              message="This profile can view events and tasks, but family settings are protected."
              actionLabel="Switch Profile"
              onAction={handleSwitchProfile}
            />
            <Pressable
              style={[styles.signOutButton, { backgroundColor: colors.accentDangerSoft }]}
              onPress={handleSignOut}
            >
              <Feather name="log-out" size={18} color={colors.destructive} />
              <Text style={[styles.signOutText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                Sign Out
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <Text style={[styles.cardHeading, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
                Family Identity
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  testID="family-name-input"
                  value={familyName}
                  onChangeText={setFamilyName}
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {familyEmail || 'No family email selected'}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
              <Text style={[styles.cardHeading, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
                Account
              </Text>
              <Pressable
                style={styles.accountRow}
                onPress={() => activeProfile && router.push(`/family/member/${activeProfile.id}`)}
              >
                <View style={[styles.accountRowIcon, { backgroundColor: colors.chip }]}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.accountRowLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Profile Settings
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <Pressable style={styles.accountRow} onPress={() => router.push('/subscription' as Href)}>
                <View style={[styles.accountRowIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="star" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.accountRowLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Home Loopnest Premium
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <Pressable style={styles.accountRow} onPress={handleSwitchProfile}>
                <View style={[styles.accountRowIcon, { backgroundColor: colors.chip }]}>
                  <Feather name="repeat" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.accountRowLabel, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Switch Active Profile
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <Pressable style={styles.accountRow} onPress={handleSignOut}>
                <View style={[styles.accountRowIcon, { backgroundColor: colors.accentDangerSoft }]}>
                  <Feather name="log-out" size={16} color={colors.destructive} />
                </View>
                <Text style={[styles.accountRowLabel, { color: colors.destructive, fontFamily: 'Inter_500Medium' }]}>
                  Sign Out
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeading: { fontSize: 20 },
  cardDescription: { fontSize: 15, lineHeight: 22 },
  inputContainer: { height: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, justifyContent: 'center' },
  input: { fontSize: 16 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  accountRowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accountRowLabel: { flex: 1, fontSize: 16 },
  divider: { height: 1, marginLeft: 56 },
  signOutButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  signOutText: { fontSize: 16 },
});
