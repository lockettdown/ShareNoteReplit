import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useAppState } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ProfileRolePicker } from '@/components/ProfileRolePicker';

const MEMBER_COLORS = ['#9b5cf6', '#f6a53a', '#12c7a0', '#f04e9b', '#5bb6ff', '#ef4444', '#22c55e', '#6366f1'];

function initialsFromName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'ME';
}

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { members, activeProfile, canManageFamily, addMember } = useAppState();
  const [showAddMember, setShowAddMember] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftColor, setDraftColor] = useState(MEMBER_COLORS[0]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function openAddMember() {
    if (!canManageFamily) return;
    setDraftName('');
    setDraftRole('Child');
    setDraftColor(MEMBER_COLORS[members.length % MEMBER_COLORS.length]);
    setShowAddMember(true);
  }

  function saveNewMember() {
    if (!canManageFamily || !draftName.trim() || !draftRole.trim()) return;
    const normalizedName = draftName.trim();
    const nameParts = normalizedName.split(/\s+/).filter(Boolean);
    addMember({
      name: normalizedName,
      nickname: nameParts[0] ?? normalizedName,
      role: draftRole.trim(),
      initials: initialsFromName(normalizedName),
      color: draftColor,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddMember(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          accessibilityLabel="Switch active profile"
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/profile-select');
          }}
          style={styles.headerLeft}
        >
          <MemberAvatar member={activeProfile ?? members[0]} size={32} headerPhoto={!activeProfile} />
        </Pressable>
        <Pressable
          disabled={!canManageFamily}
          onPress={() => router.push('/family/settings')}
          style={styles.headerTitlePressable}
        >
          <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Family Members</Text>
        </Pressable>
        {canManageFamily ? (
          <Pressable style={styles.headerRight} onPress={() => router.push('/family/settings')}>
            <Feather name="settings" size={20} color={colors.primaryStrong} />
          </Pressable>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        {canManageFamily ? (
          <Pressable
            accessibilityLabel="Invite new member"
            onPress={openAddMember}
            style={[styles.inviteCard, { borderColor: colors.primaryStrong, borderStyle: 'solid', borderWidth: 1.5, backgroundColor: colors.secondary }]}
          >
            <Feather name="user-plus" size={20} color={colors.primary} />
            <Text style={[styles.inviteText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Invite New Member</Text>
          </Pressable>
        ) : null}
        <View style={styles.membersList}>
          {members.map((member, i) => (
            <Pressable key={member.id} style={[styles.memberCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push(`/family/member/${member.id}`)}>
              <View style={[styles.cardLeftBorder, { backgroundColor: member.color }]} />
              <View style={styles.memberTop}>
                <MemberAvatar member={member} size={56} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>{member.name}</Text>
                  <Text style={[styles.memberRole, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{member.role}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.memberStats}>
                <View style={styles.statRow}>
                  <Feather name="check-square" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{i === 0 ? '3 tasks due today' : i === 1 ? '1 task due today' : 'All tasks completed'}</Text>
                </View>
                <View style={styles.statRow}>
                  <Feather name="calendar" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{i === 0 ? 'Soccer practice at 5PM' : i === 1 ? 'No upcoming events' : 'Dentist appt tomorrow'}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAddMember} transparent animationType="fade" onRequestClose={() => setShowAddMember(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAddMember(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: bottomPad + 24 }]}>
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Add Member
              </Text>
              <Pressable onPress={() => setShowAddMember(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Name
              </Text>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  placeholder="Name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Permission
              </Text>
              <ProfileRolePicker value={draftRole} onChange={setDraftRole} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Color
              </Text>
              <View style={styles.colorGrid}>
                {MEMBER_COLORS.map((color) => {
                  const selected = color === draftColor;
                  return (
                    <Pressable
                      key={color}
                      accessibilityLabel={`Select color ${color}`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDraftColor(color);
                      }}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: color,
                          borderColor: selected ? colors.foreground : colors.card,
                        },
                      ]}
                    >
                      {selected ? <Feather name="check" size={18} color="#ffffff" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={saveNewMember}
              style={[styles.saveMemberButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.saveMemberText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Add Member
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 }, headerLeft: { width: 32 }, headerTitlePressable: { flex: 1, alignItems: 'center' }, headerRight: { width: 32, alignItems: 'flex-end' }, headerTitle: { fontSize: 20 }, scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  inviteCard: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }, inviteText: { fontSize: 16 }, membersList: { gap: 16 },
  memberCard: { borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, cardLeftBorder: { position: 'absolute', left: 0, top: 24, bottom: 24, width: 6, borderTopRightRadius: 6, borderBottomRightRadius: 6 }, memberTop: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 12 }, memberInfo: { flex: 1, gap: 4 }, memberName: { fontSize: 20 }, memberRole: { fontSize: 16 }, divider: { height: 1, backgroundColor: '#ece6f5', marginVertical: 20 }, memberStats: { gap: 12, paddingLeft: 12 }, statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, statText: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 24 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14 },
  inputContainer: { height: 52, borderRadius: 12, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 15 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  saveMemberButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveMemberText: { fontSize: 16 },
});
