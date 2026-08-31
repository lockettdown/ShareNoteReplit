import {
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
import { useAppState } from '@/context/AppState';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { MemberAvatar } from '@/components/MemberAvatar';

export default function GroceriesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { groceries, members, toggleGroceryItem, addGroceryItem } = useAppState();
  const [showCompleted, setShowCompleted] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleAddItem() {
    if (!newItemName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGroceryItem({ name: newItemName.trim(), category: 'Other' });
    setNewItemName('');
  }

  const getCategoryIcon = (cat: string): keyof typeof Feather.glyphMap => {
    if (cat === 'Produce') return 'shopping-bag';
    if (cat === 'Dairy & Fridge') return 'droplet';
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
        <View style={styles.headerLeft}>
          <MemberAvatar member={members[0]} size={32} headerPhoto />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>
          Our Home
        </Text>
        <Pressable style={styles.headerRight}>
          <Feather name="bell" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 120 }]} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([category, items]) => (
          <View key={category} style={[styles.categoryCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
            <View style={styles.categoryHeader}>
              <Feather name={getCategoryIcon(category)} size={20} color={colors.primary} />
              <Text style={[styles.categoryTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>{category}</Text>
            </View>
            <View style={styles.itemsList}>
              {items.map(item => {
                const person = members.find(m => m.id === item.personId);
                return (
                  <Pressable key={item.id} style={styles.itemRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleGroceryItem(item.id); }}>
                    <View style={styles.itemLeftBorder} />
                    <View style={[styles.checkbox, item.checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      {item.checked && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={[styles.itemText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{item.name}</Text>
                    {person && <MemberAvatar member={person} size={32} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Pressable
          testID="completed-groceries-toggle"
          accessibilityLabel={`${showCompleted ? 'Hide' : 'View'} completed groceries`}
          accessibilityState={{ expanded: showCompleted }}
          style={[styles.accordion, { backgroundColor: '#fff', shadowColor: colors.primary }]}
          onPress={() => setShowCompleted((visible) => !visible)}
        >
          <Text style={[styles.accordionText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>View Completed ({completed.length})</Text>
          <Feather name={showCompleted ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
        </Pressable>

        {showCompleted && completed.length > 0 && (
          <View style={[styles.categoryCard, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
            <View style={styles.itemsList}>
              {completed.map(item => {
                const person = members.find(m => m.id === item.personId);
                return (
                  <Pressable
                    key={item.id}
                    testID={`completed-grocery-${item.id}`}
                    accessibilityLabel={`Mark unpurchased: ${item.name}`}
                    style={styles.itemRow}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleGroceryItem(item.id); }}
                  >
                    <View style={styles.itemLeftBorder} />
                    <View style={[styles.checkbox, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                    <Text style={[styles.itemText, { color: colors.foreground, fontFamily: 'Inter_400Regular', textDecorationLine: 'line-through' }]}>{item.name}</Text>
                    {person && <MemberAvatar member={person} size={32} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Item Pill */}
      <View style={[styles.addPillWrapper, { bottom: bottomPad + 60, paddingHorizontal: 24 }]}>
        <View style={[styles.addPill, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <Pressable testID="add-grocery-button" accessibilityLabel="Add grocery item" style={[styles.addPillBtn, { backgroundColor: colors.primary }]} onPress={handleAddItem}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
          <TextInput
            style={[styles.addPillInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            placeholder="Add an item..."
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="New grocery item"
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
        </View>
      </View>
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
  itemLeftBorder: { position: 'absolute', left: -24, width: 4, top: 12, bottom: 12, backgroundColor: '#3b82f6', borderTopRightRadius: 4, borderBottomRightRadius: 4, display: 'none' }, // only show on active
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#e8e0f7', alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, fontSize: 16 },
  accordion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  accordionText: { fontSize: 16 },
  addPillWrapper: { position: 'absolute', left: 0, right: 0 },
  addPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, padding: 12, gap: 16, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 6 },
  addPillBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addPillInput: { flex: 1, fontSize: 16, height: 44 },
});