import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
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
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { GroceryItem, useAppState } from '@/context/AppState';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';
import { useRouter } from 'expo-router';

const GROCERY_CATEGORIES = [
  'Dairy',
  'Produce',
  'Meats',
  'Junk Food',
  'Drinks',
  'Fruits',
  'Bakery',
  'Frozen',
  'Pantry',
  'Other',
];

const GROCERY_INPUT_ACCESSORY_ID = 'grocery-input-accessory';

export default function GroceriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { groceries, members, activeProfile, toggleGroceryItem, addGroceryItem, removeGroceryItem } = useAppState();
  const [showCompleted, setShowCompleted] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDetails, setNewItemDetails] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [showAddItemCard, setShowAddItemCard] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedGrocery, setSelectedGrocery] = useState<GroceryItem | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleAddItem() {
    if (!newItemName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGroceryItem({
      name: newItemName.trim(),
      details: newItemDetails.trim(),
      category: newItemCategory,
    });
    setNewItemName('');
    setNewItemDetails('');
    setNewItemCategory('Other');
    setShowAddItemCard(false);
  }

  function handleOpenAddItemCard() {
    Haptics.selectionAsync();
    setShowAddItemCard(true);
  }

  function handleCloseAddItemCard() {
    setShowAddItemCard(false);
    setShowCategoryPicker(false);
    setNewItemName('');
    setNewItemDetails('');
    setNewItemCategory('Other');
  }

  function handleOpenDetails(item: GroceryItem) {
    Haptics.selectionAsync();
    setSelectedGrocery(item);
  }

  function handleClearCompleted() {
    if (completed.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completed.forEach((item) => removeGroceryItem(item.id));
  }

  function handleRemoveItem(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeGroceryItem(id);
  }

  const getCategoryIcon = (cat: string): keyof typeof Feather.glyphMap => {
    if (cat === 'Produce' || cat === 'Fruits') return 'shopping-bag';
    if (cat === 'Dairy' || cat === 'Dairy & Fridge') return 'droplet';
    if (cat === 'Meats') return 'box';
    if (cat === 'Drinks') return 'coffee';
    if (cat === 'Bakery') return 'package';
    if (cat === 'Frozen') return 'cloud-snow';
    if (cat === 'Pantry') return 'archive';
    if (cat === 'Junk Food') return 'star';
    return 'shopping-cart';
  };

  const pending = groceries.filter(g => !g.checked);
  const completed = groceries.filter(g => g.checked);
  const grouped = pending.reduce<Record<string, typeof groceries>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

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
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Our Home
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 220 }]} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category} style={[styles.categoryCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.categoryHeader}>
              <Feather name={getCategoryIcon(category)} size={20} color={colors.primary} />
              <Text style={[styles.categoryTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>{category}</Text>
            </View>
            <View style={styles.itemsList}>
              {items.map(item => {
                const person = members.find(m => m.id === item.personId);
                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemLeftBorder} />
                    <Pressable
                      accessibilityLabel={`Mark purchased: ${item.name}`}
                      style={[styles.checkbox, item.checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleGroceryItem(item.id); }}
                    >
                      {item.checked && <Feather name="check" size={14} color="#fff" />}
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`View grocery details: ${item.name}`}
                      style={styles.itemContent}
                      onPress={() => handleOpenDetails(item)}
                    >
                      <Text style={[styles.itemText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{item.name}</Text>
                      {item.details ? (
                        <Text style={[styles.itemDetailsPreview, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                          {item.details}
                        </Text>
                      ) : null}
                    </Pressable>
                    {person && <MemberAvatar member={person} size={32} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable
          testID="completed-groceries-toggle"
          accessibilityLabel={`${showCompleted ? 'Hide' : 'View'} completed groceries`}
          accessibilityState={{ expanded: showCompleted }}
          style={[styles.accordion, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
          onPress={() => setShowCompleted((visible) => !visible)}
        >
          <Text style={[styles.accordionText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>View Completed ({completed.length})</Text>
          <Feather name={showCompleted ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
        </Pressable>

        {showCompleted && completed.length > 0 && (
          <View style={[styles.categoryCard, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.completedHeader}>
              <Text style={[styles.completedTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                Completed
              </Text>
              <Pressable
                testID="delete-all-completed-groceries"
                accessibilityLabel="Delete all completed groceries"
                style={[styles.deleteAllButton, { backgroundColor: '#fff0f6' }]}
                onPress={handleClearCompleted}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
                <Text style={[styles.deleteAllText, { color: colors.destructive, fontFamily: 'Inter_600SemiBold' }]}>
                  Delete All
                </Text>
              </Pressable>
            </View>
            <View style={styles.itemsList}>
              {completed.map(item => {
                const person = members.find(m => m.id === item.personId);
                return (
                  <View
                    key={item.id}
                    testID={`completed-grocery-${item.id}`}
                    style={styles.itemRow}
                  >
                    <View style={styles.itemLeftBorder} />
                    <Pressable
                      accessibilityLabel={`Mark unpurchased: ${item.name}`}
                      style={styles.completedCheckboxTarget}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleGroceryItem(item.id); }}
                    >
                      <View style={[styles.checkbox, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`View grocery details: ${item.name}`}
                      style={styles.itemContent}
                      onPress={() => handleOpenDetails(item)}
                    >
                      <Text style={[styles.itemText, { color: colors.foreground, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' }]}>{item.name}</Text>
                      {item.details ? (
                        <Text style={[styles.itemDetailsPreview, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                          {item.details}
                        </Text>
                      ) : null}
                    </Pressable>
                    {person && <MemberAvatar member={person} size={32} />}
                    <Pressable
                      testID={`delete-completed-grocery-${item.id}`}
                      accessibilityLabel={`Delete completed grocery: ${item.name}`}
                      style={[styles.deleteItemButton, { backgroundColor: '#fff0f6' }]}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Feather name="trash-2" size={18} color={colors.destructive} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Item Button */}
      <View style={[styles.addPillWrapper, { bottom: bottomPad + 60, paddingHorizontal: 24 }]}>
        <View style={[styles.addPill, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Pressable testID="add-grocery-button" accessibilityLabel="Add grocery item" style={styles.addPillTopRow} onPress={handleOpenAddItemCard}>
            <View style={[styles.addPillBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={20} color="#fff" />
            </View>
            <Text style={[styles.addPillText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              Add an item...
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={showAddItemCard} transparent animationType="fade" onRequestClose={handleCloseAddItemCard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <Pressable
            style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
            onPress={Keyboard.dismiss}
          >
            <Pressable
              style={[styles.addItemSheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
              onPress={(event) => event.stopPropagation()}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.addItemSheetContent}
              >
                <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
                <View style={styles.sheetHeader}>
                  <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
                    Add Grocery Item
                  </Text>
                  <Pressable accessibilityLabel="Close add item" style={styles.sheetCloseButton} onPress={handleCloseAddItemCard}>
                    <Feather name="x" size={22} color={colors.foreground} />
                  </Pressable>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    Item
                  </Text>
                  <TextInput
                    style={[styles.formInput, { borderColor: colors.border, color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                    placeholder="Item name"
                    placeholderTextColor={colors.mutedForeground}
                    accessibilityLabel="Grocery item name"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    returnKeyType="next"
                    inputAccessoryViewID={GROCERY_INPUT_ACCESSORY_ID}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    Details
                  </Text>
                  <TextInput
                    style={[styles.formInput, styles.detailsInput, { borderColor: colors.border, color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                    placeholder="Notes, brand, quantity, size..."
                    placeholderTextColor={colors.mutedForeground}
                    accessibilityLabel="Grocery item details"
                    value={newItemDetails}
                    onChangeText={setNewItemDetails}
                    multiline
                    blurOnSubmit
                    returnKeyType="done"
                    inputAccessoryViewID={GROCERY_INPUT_ACCESSORY_ID}
                    textAlignVertical="top"
                  />
                </View>

                <Pressable
                  accessibilityLabel="Choose grocery category"
                  accessibilityState={{ expanded: showCategoryPicker }}
                  onPress={() => {
                    Keyboard.dismiss();
                    Haptics.selectionAsync();
                    setShowCategoryPicker((visible) => !visible);
                  }}
                  style={[styles.categorySelect, { backgroundColor: colors.secondary }]}
                >
                  <Feather name={getCategoryIcon(newItemCategory)} size={16} color={colors.primaryStrong} />
                  <Text style={[styles.categorySelectText, { color: colors.primaryStrong, fontFamily: 'Inter_600SemiBold' }]}>
                    {newItemCategory}
                  </Text>
                  <Feather name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primaryStrong} />
                </Pressable>

                {showCategoryPicker ? (
                  <View style={styles.categoryGrid}>
                    {GROCERY_CATEGORIES.map((category) => {
                      const selected = category === newItemCategory;
                      return (
                        <Pressable
                          key={category}
                          accessibilityLabel={`Select ${category}`}
                          accessibilityState={{ selected }}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setNewItemCategory(category);
                            setShowCategoryPicker(false);
                          }}
                          style={[
                            styles.categoryOption,
                            { backgroundColor: selected ? colors.primary : colors.cardSoft, borderColor: selected ? colors.primary : colors.border },
                          ]}
                        >
                          <Feather name={getCategoryIcon(category)} size={16} color={selected ? '#ffffff' : colors.primaryStrong} />
                          <Text
                            style={[
                              styles.categoryOptionText,
                              {
                                color: selected ? '#ffffff' : colors.foreground,
                                fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                              },
                            ]}
                          >
                            {category}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable
                  accessibilityLabel="Save grocery item"
                  style={[styles.saveItemButton, { backgroundColor: newItemName.trim() ? colors.primary : colors.border }]}
                  onPress={handleAddItem}
                >
                  <Text style={[styles.saveItemText, { color: '#ffffff', fontFamily: 'Inter_700Bold' }]}>
                    Add Item
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
        {Platform.OS === 'ios' ? (
          <InputAccessoryView nativeID={GROCERY_INPUT_ACCESSORY_ID}>
            <View style={[styles.keyboardAccessory, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <Pressable accessibilityLabel="Close keyboard" style={styles.keyboardDoneButton} onPress={Keyboard.dismiss}>
                <Text style={[styles.keyboardDoneText, { color: colors.primaryStrong, fontFamily: 'Inter_700Bold' }]}>
                  Done
                </Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        ) : null}
      </Modal>

      <Modal visible={Boolean(selectedGrocery)} transparent animationType="fade" onRequestClose={() => setSelectedGrocery(null)}>
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setSelectedGrocery(null)}
        >
          <Pressable
            style={[styles.detailSheet, { backgroundColor: colors.card, shadowColor: colors.shadow }]}
            onPress={() => null}
          >
            <View style={[styles.modalDragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <View style={[styles.detailIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={getCategoryIcon(selectedGrocery?.category ?? 'Other')} size={26} color={colors.primaryStrong} />
              </View>
              <Pressable accessibilityLabel="Close grocery details" style={styles.sheetCloseButton} onPress={() => setSelectedGrocery(null)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.detailCategory, { color: colors.primaryStrong, fontFamily: 'Inter_700Bold' }]}>
              {selectedGrocery?.category}
            </Text>
            <Text style={[styles.detailTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
              {selectedGrocery?.name}
            </Text>
            <View style={[styles.detailInfoCard, { backgroundColor: colors.cardSoft }]}>
              <Text style={[styles.detailInfoLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Details
              </Text>
              <Text style={[styles.detailInfoText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                {selectedGrocery?.details?.trim() || 'No details added.'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerLeft: { width: 32 },
  headerRight: { width: 32, alignItems: 'flex-end' },
  headerTitle: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, gap: 24 },
  categoryCard: {
    borderRadius: 24, padding: 24, paddingBottom: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  categoryTitle: { fontSize: 20 },
  itemsList: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, position: 'relative' },
  itemContent: { flex: 1, gap: 4 },
  itemDetailsPreview: { fontSize: 13 },
  completedCheckboxTarget: { alignItems: 'center', justifyContent: 'center' },
  itemLeftBorder: { position: 'absolute', left: -24, width: 4, top: 12, bottom: 12, backgroundColor: '#5bb6ff', borderTopRightRadius: 4, borderBottomRightRadius: 4, display: 'none' }, // only show on active
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#e1d8f2', alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, fontSize: 16 },
  completedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  completedTitle: { fontSize: 18 },
  deleteAllButton: { minHeight: 40, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  deleteAllText: { fontSize: 13 },
  deleteItemButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  accordion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  accordionText: { fontSize: 16 },
  addPillWrapper: { position: 'absolute', left: 0, right: 0 },
  addPill: { borderRadius: 24, padding: 12, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6 },
  addPillTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  addPillBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addPillText: { flex: 1, fontSize: 16 },
  categorySelect: { height: 40, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  categorySelectText: { fontSize: 14 },
  keyboardAvoiding: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  addItemSheet: { borderRadius: 24, maxHeight: '92%', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  addItemSheetContent: { padding: 20, gap: 16 },
  categorySheet: { borderRadius: 24, padding: 20, gap: 16, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  modalDragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sheetCloseButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 22, textAlign: 'center' },
  formGroup: { gap: 8 },
  inputLabel: { fontSize: 15 },
  formInput: { minHeight: 52, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16 },
  detailsInput: { minHeight: 104, paddingTop: 14, paddingBottom: 14 },
  saveItemButton: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveItemText: { fontSize: 16 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryOption: { minHeight: 48, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  categoryOptionText: { fontSize: 14 },
  keyboardAccessory: { minHeight: 44, borderTopWidth: 1, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 16 },
  keyboardDoneButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  keyboardDoneText: { fontSize: 16 },
  detailSheet: { borderRadius: 28, padding: 24, gap: 16, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  detailIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailCategory: { fontSize: 13, textTransform: 'uppercase' },
  detailTitle: { fontSize: 30 },
  detailInfoCard: { borderRadius: 20, padding: 18, gap: 8 },
  detailInfoLabel: { fontSize: 13, textTransform: 'uppercase' },
  detailInfoText: { fontSize: 16, lineHeight: 23 },
});
