import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberAvatar } from '@/components/MemberAvatar';
import { useAppState } from '@/context/AppState';
import { useColors } from '@/hooks/useColors';
import { isParentRole } from '@/utils/profilePermissions';

export default function ProfileSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const {
    familyEmail,
    isAuthLoading,
    isFamilyStateLoading,
    members,
    dashboardMembers,
    activeProfileId,
    selectActiveProfile,
    signOut,
  } = useAppState();
  const allMembers = [...members, ...dashboardMembers.filter((member) => !members.some((item) => item.id === member.id))];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [pendingParentId, setPendingParentId] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState('');
  const [authorizationError, setAuthorizationError] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !familyEmail) {
      router.replace('/sign-in');
    }
  }, [familyEmail, isAuthLoading, router]);

  async function authorizeProfile(profileId: string, password?: string) {
    setIsAuthorizing(true);
    setAuthorizationError('');
    let result;
    try {
      result = await selectActiveProfile(profileId, password);
    } catch {
      result = { ok: false, message: 'Unable to verify this profile. Check your connection and try again.' };
    } finally {
      setIsAuthorizing(false);
    }
    if (!result.ok) {
      setAuthorizationError(result.message ?? 'This profile could not be authorized.');
      return;
    }
    setPendingParentId(null);
    setParentPassword('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }

  function chooseProfile(profileId: string, isParent: boolean) {
    if (isParent) {
      setAuthorizationError('');
      setParentPassword('');
      setPendingParentId(profileId);
      return;
    }
    void authorizeProfile(profileId);
  }

  function useDifferentEmail() {
    Haptics.selectionAsync();
    void signOut();
    router.replace('/sign-in');
  }

  if (isAuthLoading || isFamilyStateLoading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          Loading family profiles...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 32, paddingBottom: bottomPad + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <Feather name="smartphone" size={28} color={colors.primaryStrong} />
          </View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            Who's using this device?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {familyEmail || 'Family account'}
          </Text>
        </View>

        <View style={styles.profileList}>
          {allMembers.map((member) => {
            const selected = member.id === activeProfileId;
            const isParent = isParentRole(member.role);
            return (
              <Pressable
                key={member.id}
                accessibilityLabel={`Use ${member.name} on this device`}
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.profileCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    shadowColor: colors.shadow,
                    opacity: pressed ? 0.86 : 1,
                  },
                ]}
                onPress={() => chooseProfile(member.id, isParent)}
              >
                <View style={[styles.cardLeftBorder, { backgroundColor: member.color }]} />
                <MemberAvatar member={member} size={56} selected={selected} />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                    {member.name}
                  </Text>
                  <View style={styles.profileMeta}>
                    <Feather
                      name={isParent ? 'shield' : 'eye'}
                      size={14}
                      color={isParent ? colors.primaryStrong : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.profileRole,
                        {
                          color: isParent ? colors.primaryStrong : colors.mutedForeground,
                          fontFamily: 'Inter_600SemiBold',
                        },
                      ]}
                    >
                      {isParent ? 'Parent' : 'Child'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel="Use a different family email"
          onPress={useDifferentEmail}
          style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="mail" size={18} color={colors.primaryStrong} />
          <Text style={[styles.secondaryButtonText, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
            Use Different Email
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(pendingParentId)}
        onRequestClose={() => setPendingParentId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
              Verify Parent Access
            </Text>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Enter the family account password to use Parent controls on this device.
            </Text>
            <TextInput
              autoFocus
              secureTextEntry
              value={parentPassword}
              onChangeText={setParentPassword}
              placeholder="Family password"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.passwordInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onSubmitEditing={() => {
                if (pendingParentId && parentPassword) void authorizeProfile(pendingParentId, parentPassword);
              }}
            />
            {authorizationError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{authorizationError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable
                disabled={isAuthorizing}
                onPress={() => setPendingParentId(null)}
                style={[styles.modalButton, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={!parentPassword || isAuthorizing}
                onPress={() => pendingParentId && void authorizeProfile(pendingParentId, parentPassword)}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary, opacity: !parentPassword || isAuthorizing ? 0.55 : 1 },
                ]}
              >
                {isAuthorizing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>Verify</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 28 },
  header: { alignItems: 'center', gap: 10 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: { fontSize: 28, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  profileList: { gap: 14 },
  profileCard: {
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    paddingLeft: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLeftBorder: { position: 'absolute', left: 0, top: 18, bottom: 18, width: 5, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 18 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileRole: { fontSize: 14 },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: { fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 24, gap: 14 },
  modalTitle: { fontSize: 21 },
  modalDescription: { fontSize: 15, lineHeight: 22 },
  passwordInput: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  errorText: { fontSize: 13, lineHeight: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  modalButton: { minWidth: 96, minHeight: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
});
