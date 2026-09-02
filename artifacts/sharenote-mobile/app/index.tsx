import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useAppState } from '@/context/AppState';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { activeProfile, familyEmail, isAuthLoading, isFamilyStateLoading } = useAppState();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleCreateFamily() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/create-family');
  }

  function handleSignIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/sign-in');
  }

  if (isAuthLoading || isFamilyStateLoading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          Loading ShareNote...
        </Text>
      </View>
    );
  }

  if (familyEmail && activeProfile) return <Redirect href="/(tabs)" />;
  if (familyEmail) return <Redirect href="/profile-select" />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Soft gradient background simulation */}
      <View style={[styles.orbTop, { backgroundColor: colors.orbPurple }]} />
      <View style={[styles.orbBottom, { backgroundColor: colors.orbBlue }]} />

      <View
        style={[
          styles.content,
          { paddingTop: topPad + 60, paddingBottom: bottomPad + 40 },
        ]}
      >
        <View style={styles.hero}>
          <View style={[styles.logoContainer, { shadowColor: colors.primary }]}>
            <Feather name="users" size={48} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontFamily: 'Montserrat_700Bold' },
            ]}
          >
            ShareNote
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
            ]}
          >
            {'Welcome to your family\'s new home.\nCoordinate, connect, and simplify.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            testID="create-family-btn"
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.shadow,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleCreateFamily}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: '#ffffff', fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Create Family
            </Text>
          </Pressable>

          <Pressable
            testID="sign-in-btn"
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: colors.card,
                shadowColor: colors.shadow,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleSignIn}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.primary, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { fontSize: 15 },
  orbTop: {
    position: 'absolute', width: '150%', height: '50%',
    borderRadius: 9999, left: '-25%', top: '-15%',
    opacity: 0.6,
  },
  orbBottom: {
    position: 'absolute', width: '150%', height: '50%',
    borderRadius: 9999, left: '-25%', bottom: '-15%',
    opacity: 0.6,
  },
  content: {
    flex: 1, justifyContent: 'space-between', paddingHorizontal: 24,
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: {
    width: 100, height: 100, backgroundColor: '#ffffff',
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    marginBottom: 32,
  },
  title: { fontSize: 32, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  actions: { gap: 16 },
  primaryButton: {
    height: 56, borderRadius: 9999, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4,
  },
  primaryButtonText: { fontSize: 16 },
  secondaryButton: {
    height: 56, borderRadius: 9999, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e1d8f2',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  secondaryButtonText: { fontSize: 16 },
});
