import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAppState } from '@/context/AppState';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { signInFamily } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    signInFamily(email);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/profile-select');
  }

  const inputContainerStyle = (field: string) => ({
    ...styles.inputContainer,
    borderColor: focusedField === field ? colors.primary : colors.border,
    backgroundColor: colors.card,
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 40, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { shadowColor: colors.primary }]}>
            <Feather name="home" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            Sign In
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Welcome back to your family hub.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Email Address
            </Text>
            <View style={inputContainerStyle('email')}>
              <Feather name="mail" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="hello@family.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Password
            </Text>
            <View style={inputContainerStyle('password')}>
              <Feather name="lock" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </View>
          </View>

          <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotPass}>
            <Text style={[styles.forgotPassText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Forgot Password?
            </Text>
          </Pressable>

          <Pressable
            testID="sign-in-btn"
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleSignIn}
          >
            <Text style={[styles.submitButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>
              Sign In
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Don't have a family account?
          </Text>
          <Pressable onPress={() => router.push('/create-family')}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Create one
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 72, height: 72, backgroundColor: '#ffffff',
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    marginBottom: 24,
  },
  title: { fontSize: 32, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  card: {
    borderRadius: 24, padding: 24, gap: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  forgotPass: { alignSelf: 'flex-end' },
  forgotPassText: { fontSize: 13 },
  submitButton: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16 },
  footer: { alignItems: 'center', gap: 6, marginTop: 40 },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15 },
});
