import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

type FormDropdownFieldProps<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
};

export function FormDropdownField<T extends string>({
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
}: FormDropdownFieldProps<T>) {
  const colors = useColors();

  function selectOption(nextValue: T) {
    Haptics.selectionAsync();
    onChange(nextValue);
    onOpenChange(false);
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
        {label}
      </Text>
      <Pressable
        onPress={() => onOpenChange(true)}
        style={({ pressed }) => [
          styles.dropdownContainer,
          {
            borderColor: open ? colors.primaryStrong : colors.border,
            opacity: pressed ? 0.86 : 1,
          },
        ]}
      >
        <Text style={[styles.dropdownText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
          {value}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mutedForeground} />
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={() => onOpenChange(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => onOpenChange(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => null}
          >
            <Text style={[styles.sheetTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
              {label}
            </Text>
            <View style={styles.optionList}>
              {options.map((option) => {
                const selected = option === value;
                return (
                  <Pressable
                    key={option}
                    onPress={() => selectOption(option)}
                    style={[
                      styles.optionRow,
                      { backgroundColor: selected ? colors.secondary : colors.cardSoft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: selected ? colors.primaryStrong : colors.foreground,
                          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {selected ? <Feather name="check" size={20} color={colors.primaryStrong} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  dropdownText: { fontSize: 15 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  sheetTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  optionList: { gap: 10 },
  optionRow: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: { fontSize: 15 },
});
