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
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAppState } from '@/context/AppState';
import { useColors } from '@/hooks/useColors';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { authUser, isAuthLoading, signOut, updatePassword } = useAppState();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  async function handleUpdatePassword() {
    if (password.length < 8) {
      setMessage('Use at least 8 characters for your new password.');
      setIsSuccessMessage(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Your new passwords do not match.');
      setIsSuccessMessage(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message ?? 'Unable to update your password.');
      setIsSuccessMessage(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setMessage('Password updated. Please sign in with your new password.');
    setIsSuccessMessage(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await signOut();
    router.replace('/sign-in');
  }

  const inputContainerStyle = (field: string) => ({
    ...styles.inputContainer,
    borderColor: focusedField === field ? colors.primary : colors.border,
    backgroundColor: colors.card,
  });

  if (isAuthLoading) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          Verifying your reset link...
        </Text>
      </View>
    );
  }

  if (!authUser) {
    return (
      <View style={[styles.root, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Link unavailable</Text>
        <Text style={[styles.invalidLinkText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          This password reset link is invalid or has expired. Request a new link to continue.
        </Text>
        <Pressable onPress={() => router.replace('/forgot-password')} style={[styles.submitButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.submitButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>Request New Link</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 48, paddingBottom: bottomPad + 32 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>Set New Password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Choose a new password for {authUser.email ?? 'your family account'}.</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>New Password</Text>
            <View style={inputContainerStyle('password')}>
              <Feather name="lock" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Confirm New Password</Text>
            <View style={inputContainerStyle('confirmPassword')}>
              <Feather name="lock" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                onSubmitEditing={handleUpdatePassword}
              />
            </View>
          </View>

          <Pressable
            disabled={isSubmitting}
            onPress={handleUpdatePassword}
            style={({ pressed }) => [styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.62 : pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.submitButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>{isSubmitting ? 'Updating...' : 'Update Password'}</Text>
          </Pressable>

          {message ? <Text style={[styles.messageText, { color: isSuccessMessage ? colors.accentTeal : colors.destructive, fontFamily: 'Inter_500Medium' }]}>{message}</Text> : null}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  card: { borderRadius: 24, padding: 24, gap: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  submitButton: { width: '100%', minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  submitButtonText: { fontSize: 16 },
  messageText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  loadingText: { fontSize: 15 },
  invalidLinkText: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginVertical: 16 },
});
