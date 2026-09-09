import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { GroceryItem } from '@/context/AppState';
import { useColors } from '@/hooks/useColors';

type GroceryDetailSheetProps = {
  grocery: GroceryItem | null;
  onClose: () => void;
};

function getCategoryIcon(category: string): keyof typeof Feather.glyphMap {
  if (category === 'Produce' || category === 'Fruits') return 'shopping-bag';
  if (category === 'Dairy' || category === 'Dairy & Fridge') return 'droplet';
  if (category === 'Meats') return 'box';
  if (category === 'Drinks') return 'coffee';
  if (category === 'Bakery') return 'package';
  if (category === 'Frozen') return 'cloud-snow';
  if (category === 'Pantry') return 'archive';
  if (category === 'Junk Food') return 'star';
  return 'shopping-cart';
}

export function GroceryDetailSheet({ grocery, onClose }: GroceryDetailSheetProps) {
  const colors = useColors();

  return (
    <Modal visible={Boolean(grocery)} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.detailSheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeader}>
            <View style={[styles.detailIcon, { backgroundColor: colors.secondary }]}>
              <Feather name={getCategoryIcon(grocery?.category ?? 'Other')} size={26} color={colors.primaryStrong} />
            </View>
            <Pressable accessibilityLabel="Close grocery details" style={styles.sheetCloseButton} onPress={onClose}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.detailCategory, { color: colors.primaryStrong, fontFamily: 'Inter_700Bold' }]}>
            {grocery?.category}
          </Text>
          <Text style={[styles.detailTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            {grocery?.name}
          </Text>
          <View style={[styles.detailInfoCard, { backgroundColor: colors.cardSoft }]}>
            <Text style={[styles.detailInfoLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              Details
            </Text>
            <Text style={[styles.detailInfoText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
              {grocery?.details?.trim() || 'No details added.'}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  detailSheet: { borderRadius: 28, padding: 24, gap: 16, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sheetCloseButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailCategory: { fontSize: 13, textTransform: 'uppercase' },
  detailTitle: { fontSize: 30 },
  detailInfoCard: { borderRadius: 20, padding: 18, gap: 8 },
  detailInfoLabel: { fontSize: 13, textTransform: 'uppercase' },
  detailInfoText: { fontSize: 16, lineHeight: 23 },
});