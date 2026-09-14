import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PREMIUM_BENEFITS, useSubscription } from '@/lib/revenuecat';

function planLabel(pkg: PurchasesPackage) {
  if (pkg.identifier === '$rc_monthly') return 'Monthly';
  if (pkg.identifier === '$rc_annual') return 'Yearly';
  return pkg.product.title;
}

function planDescription(pkg: PurchasesPackage) {
  return (pkg.product.description || pkg.product.title)
    .replace(/sharenote/gi, 'Loopnest')
    .replace(/Home Loopnest Premium/gi, 'Loopnest Premium');
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { packages, isSubscribed, isTrialActive, isTrialExpired, trialDaysRemaining, isLoading, isPurchasing, isRestoring, error, isTestMode, purchase, restore, refresh } = useSubscription();
  const [pendingPackage, setPendingPackage] = useState<PurchasesPackage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function buy(pkg: PurchasesPackage) {
    if (isTestMode) {
      setPendingPackage(pkg);
      return;
    }
    const active = await purchase(pkg);
    if (active) setNotice('Your Home Loopnest Premium subscription is active.');
  }

  async function confirmTestPurchase() {
    if (!pendingPackage) return;
    const pkg = pendingPackage;
    setPendingPackage(null);
    const active = await purchase(pkg);
    setNotice(active ? 'Test purchase complete. Premium is active.' : null);
  }

  async function handleRestore() {
    const active = await restore();
    setNotice(active ? 'Your subscription was restored.' : 'No active subscription was found.');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {isTrialExpired ? <View style={styles.headerSide} /> : (
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerSide}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </Pressable>
        )}
        <Text style={[styles.headerTitle, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>Loopnest Premium</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.crown, { backgroundColor: colors.card }]}><Feather name="star" size={28} color={colors.primary} /></View>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground, fontFamily: 'Montserrat_700Bold' }]}>
            {isSubscribed
              ? 'Your subscription is active'
              : isTrialActive
                ? `${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left in your trial`
                : 'Choose a plan to continue'}
          </Text>
          <Text style={[styles.heroBody, { color: colors.primaryForeground, fontFamily: 'Inter_400Regular' }]}>
            {isSubscribed
              ? 'Home Loopnest is ready for your whole family.'
              : isTrialActive
                ? 'Enjoy full access during your 10-day trial. Subscribe to keep using Home Loopnest afterward.'
                : 'Your 10-day trial has ended. Select monthly or yearly billing to continue using Home Loopnest.'}
          </Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.benefitsTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Your Loopnest plan includes</Text>
          {PREMIUM_BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={benefit.icon} size={19} color={colors.primaryStrong} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={[styles.benefitTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.muted, { color: colors.mutedForeground }]}>Loading plans…</Text></View>
        ) : packages.length === 0 ? (
          <View style={[styles.messageCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.messageTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Plans are unavailable</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Check your connection and try again.</Text>
            <Pressable onPress={() => void refresh()}><Text style={[styles.link, { color: colors.primary }]}>Try again</Text></Pressable>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map((pkg) => {
              const yearly = pkg.identifier === '$rc_annual';
              return (
                <Pressable
                  key={pkg.identifier}
                  accessibilityLabel={`Subscribe ${planLabel(pkg)} for ${pkg.product.priceString}`}
                  disabled={isSubscribed || isPurchasing}
                  onPress={() => { Haptics.selectionAsync(); void buy(pkg); }}
                  style={[styles.plan, { backgroundColor: colors.card, borderColor: yearly ? colors.primary : colors.border, shadowColor: colors.shadow }]}
                >
                  {yearly ? (
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.primaryStrong, fontFamily: 'Inter_700Bold' }]}>BEST VALUE</Text>
                    </View>
                  ) : null}
                  <View style={styles.planRow}>
                    <View style={styles.planText}>
                      <Text style={[styles.planName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>{planLabel(pkg)}</Text>
                      <Text style={[styles.planDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{planDescription(pkg)}</Text>
                    </View>
                    <View style={styles.priceBlock}>
                      <Text style={[styles.price, { color: colors.primaryStrong, fontFamily: 'Montserrat_700Bold' }]}>{pkg.product.priceString}</Text>
                      <Text style={[styles.period, { color: colors.mutedForeground }]}>/{yearly ? 'year' : 'month'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {error && error !== 'Purchase cancelled.' ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        {notice ? <Text style={[styles.notice, { color: colors.primaryStrong, backgroundColor: colors.secondary }]}>{notice}</Text> : null}

        <Pressable disabled={isRestoring || isPurchasing} onPress={() => void handleRestore()} style={styles.restore}>
          {isRestoring ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.link, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Restore Purchases</Text>}
        </Pressable>
        <Text style={[styles.finePrint, { color: colors.mutedForeground }]}>Subscriptions renew automatically unless cancelled through your store account. Prices and billing periods are supplied by the App Store, Google Play, or RevenueCat Test Store.</Text>
      </ScrollView>

      <Modal visible={Boolean(pendingPackage)} transparent animationType="fade" onRequestClose={() => setPendingPackage(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Confirm test purchase</Text>
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>Purchase {pendingPackage ? `${planLabel(pendingPackage)} for ${pendingPackage.product.priceString}` : 'this plan'} in RevenueCat Test Store mode?</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPendingPackage(null)} style={[styles.modalButton, { borderColor: colors.border }]}><Text style={{ color: colors.foreground }}>Cancel</Text></Pressable>
              <Pressable onPress={() => void confirmTestPurchase()} style={[styles.modalButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>Continue</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerSide: { width: 36 },
  headerTitle: { fontSize: 20 },
  content: { paddingHorizontal: 24, gap: 20 },
  hero: { borderRadius: 28, padding: 24, alignItems: 'center', gap: 12 },
  crown: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 24, textAlign: 'center' },
  heroBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', opacity: 0.92 },
  benefitsCard: { borderRadius: 22, padding: 20, gap: 16 },
  benefitsTitle: { fontSize: 19 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  benefitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1, gap: 3 },
  benefitTitle: { fontSize: 15 },
  benefitDescription: { fontSize: 13, lineHeight: 18 },
  center: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 12 },
  muted: { fontSize: 14, lineHeight: 20, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  messageCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  messageTitle: { fontSize: 17 },
  plans: { gap: 14 },
  plan: { borderWidth: 2, borderRadius: 20, padding: 18, gap: 10, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11 },
  planRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  planText: { flex: 1, minWidth: 0, gap: 4 },
  planName: { fontSize: 18 },
  planDescription: { fontSize: 13, lineHeight: 18 },
  priceBlock: { flexShrink: 0, alignItems: 'flex-end' },
  price: { fontSize: 21 },
  period: { fontSize: 12 },
  error: { fontSize: 14, textAlign: 'center' },
  notice: { padding: 14, borderRadius: 14, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  finePrint: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});