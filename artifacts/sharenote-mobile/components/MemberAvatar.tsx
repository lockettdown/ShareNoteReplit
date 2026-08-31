import { Feather } from '@expo/vector-icons';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { FamilyMember } from '@/context/AppState';

const MEMBER_PHOTOS: Record<string, ImageSourcePropType> = {
  m1: require('../assets/images/david-smith.jpg'),
  m2: require('../assets/images/maya-smith.jpg'),
  m3: require('../assets/images/leo-smith.jpg'),
};

const HEADER_PHOTO = require('../assets/images/family-header.jpg');

type MemberAvatarProps = {
  member: FamilyMember;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  headerPhoto?: boolean;
  selected?: boolean;
};

export function MemberAvatar({
  member,
  size = 32,
  borderColor = '#fff',
  borderWidth = 2,
  headerPhoto = false,
  selected = false,
}: MemberAvatarProps) {
  const photo = headerPhoto ? HEADER_PHOTO : MEMBER_PHOTOS[member.id];
  const resolvedBorderColor = selected ? '#935bf0' : borderColor;
  const resolvedBorderWidth = selected ? 2 : borderWidth;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: member.color,
            borderColor: resolvedBorderColor,
            borderWidth: resolvedBorderWidth,
          },
        ]}
      >
        {photo ? (
          <Image source={photo} style={styles.image} resizeMode="cover" accessibilityLabel={`${member.name} profile photo`} />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.35, fontFamily: 'Inter_600SemiBold' }]}>
            {member.initials}
          </Text>
        )}
      </View>
      {selected && (
        <View style={styles.selectedBadge}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  initials: { color: '#fff' },
  selectedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#935bf0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
});