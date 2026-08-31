import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useAppState } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { members } = useAppState();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerLeft}><MemberAvatar member={members[0]} size={32} headerPhoto /></View>
        <Pressable onPress={() => router.push('/family/settings')} style={styles.headerTitlePressable}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Family Members</Text>
        </Pressable>
        <Pressable style={styles.headerRight} onPress={() => router.push('/family/settings')}>
          <Feather name="settings" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>
        <Pressable style={[styles.inviteCard, { borderColor: '#d4bbff', borderStyle: 'dashed', borderWidth: 1.5, backgroundColor: 'transparent' }]}>
          <Feather name="user-plus" size={20} color={colors.primary} />
          <Text style={[styles.inviteText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Invite New Member</Text>
        </Pressable>
        <View style={styles.membersList}>
          {members.map((member, i) => (
            <Pressable key={member.id} style={[styles.memberCard, { backgroundColor: '#fff', shadowColor: colors.primary }]} onPress={() => router.push(`/family/member/${member.id}`)}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 }, headerLeft: { width: 32 }, headerTitlePressable: { flex: 1, alignItems: 'center' }, headerRight: { width: 32, alignItems: 'flex-end' }, headerTitle: { fontSize: 20 }, scroll: { flex: 1 }, scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  inviteCard: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 }, inviteText: { fontSize: 16 }, membersList: { gap: 16 },
  memberCard: { borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, cardLeftBorder: { position: 'absolute', left: 0, top: 24, bottom: 24, width: 6, borderTopRightRadius: 6, borderBottomRightRadius: 6 }, memberTop: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 12 }, memberInfo: { flex: 1, gap: 4 }, memberName: { fontSize: 20 }, memberRole: { fontSize: 16 }, divider: { height: 1, backgroundColor: '#f0ecff', marginVertical: 20 }, memberStats: { gap: 12, paddingLeft: 12 }, statRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, statText: { fontSize: 14 },
});