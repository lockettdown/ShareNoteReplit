import { StyleSheet, Text, View } from 'react-native';
import type { FamilyMember } from '@/context/AppState';
import { MemberAvatar } from '@/components/MemberAvatar';
import { useColors } from '@/hooks/useColors';

type AssignedMemberAvatarsProps = {
  members: FamilyMember[];
  size?: number;
  maxVisible?: number;
};

export function AssignedMemberAvatars({
  members,
  size = 36,
  maxVisible = 3,
}: AssignedMemberAvatarsProps) {
  const colors = useColors();
  const visibleMembers = members.slice(0, maxVisible);
  const overflowCount = members.length - visibleMembers.length;

  if (members.length === 0) return null;

  return (
    <View style={styles.row}>
      {visibleMembers.map((member, index) => (
        <View key={member.id} style={[styles.avatarWrap, index > 0 && { marginLeft: -8 }]}>
          <MemberAvatar member={member} size={size} />
        </View>
      ))}
      {overflowCount > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.secondary,
              borderColor: colors.card,
            },
          ]}
        >
          <Text style={[styles.overflowText, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
            +{overflowCount}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { borderRadius: 999 },
  overflow: {
    marginLeft: -8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: { fontSize: 12 },
});
