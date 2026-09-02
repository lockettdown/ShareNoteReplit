import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { normalizeProfileRole } from '@/utils/profilePermissions';

type ProfileRolePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

const PROFILE_ROLES = ['Parent', 'Child'] as const;

export function ProfileRolePicker({ value, onChange }: ProfileRolePickerProps) {
  const colors = useColors();
  const normalizedValue = normalizeProfileRole(value);

  return (
    <View style={[styles.roleRow, { backgroundColor: colors.chip }]}>
      {PROFILE_ROLES.map((role) => {
        const selected = normalizedValue === role;
        return (
          <Pressable
            key={role}
            accessibilityLabel={`Set permission to ${role}`}
            accessibilityState={{ selected }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(role);
            }}
            style={[
              styles.roleOption,
              selected && [styles.roleOptionActive, { backgroundColor: colors.card, shadowColor: colors.shadow }],
            ]}
          >
            <Feather
              name={role === 'Parent' ? 'shield' : 'eye'}
              size={15}
              color={selected ? colors.primaryStrong : colors.mutedForeground}
            />
            <Text
              style={[
                styles.roleOptionText,
                {
                  color: selected ? colors.primaryStrong : colors.mutedForeground,
                  fontFamily: 'Inter_600SemiBold',
                },
              ]}
            >
              {role}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 4 },
  roleOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  roleOptionActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  roleOptionText: { fontSize: 14 },
});
