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
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function handleSendReset() {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const inputContainerStyle = (field: string) => ({
    ...styles.inputContainer,
    borderColor: focusedField === field ? colors.primary : colors.border,
    backgroundColor: '#fff',
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: '#fff', opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        <View style={[styles.card, { backgroundColor: '#fff', shadowColor: colors.primary }]}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            No worries! Enter the email address associated with your family account and we'll send you a link to reset your password.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Email Address
            </Text>
            <View style={inputContainerStyle('email')}>
              <Feather name="mail" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="family@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSendReset}
              />
            </View>
          </View>

          <Pressable
            testID="send-reset-btn"
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleSendReset}
          >
            <Text style={[styles.submitButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>
              Send Reset Link
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Back to Sign In
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
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 32,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  card: {
    borderRadius: 24, padding: 24, gap: 24,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  title: { fontSize: 24, letterSpacing: -0.6 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  submitButton: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: -4 },
  backLinkText: { fontSize: 15 },
});