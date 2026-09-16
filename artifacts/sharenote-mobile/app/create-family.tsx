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
import { useAppState } from '@/context/AppState';

export default function CreateFamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { createFamily } = useAppState();

  const [familyName, setFormFamilyName] = useState('');
  const [yourName, setYourName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  async function handleSubmit() {
    const normalizedFamilyName = familyName.trim();
    const normalizedYourName = yourName.trim();
    const normalizedEmail = email.trim();
    if (!normalizedFamilyName || !normalizedYourName || !normalizedEmail || !password.trim()) {
      setMessage('Complete every field to create your family.');
      setIsSuccessMessage(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setIsSuccessMessage(false);

    const result = await createFamily(normalizedFamilyName, normalizedYourName, normalizedEmail, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message ?? 'Unable to create your family.');
      setIsSuccessMessage(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setMessage(result.message ?? 'Check your email to confirm the new account.');
      setIsSuccessMessage(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

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
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Montserrat_700Bold' }]}>
            Create Family
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Set up your family's shared space.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Family Name
            </Text>
            <View style={inputContainerStyle('familyName')}>
              <Feather name="users" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="e.g. The Smiths"
                placeholderTextColor={colors.mutedForeground}
                value={familyName}
                onChangeText={setFormFamilyName}
                onFocus={() => setFocusedField('familyName')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Your Name
            </Text>
            <View style={inputContainerStyle('yourName')}>
              <Feather name="user" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                value={yourName}
                onChangeText={setYourName}
                onFocus={() => setFocusedField('yourName')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
              Email Address
            </Text>
            <View style={inputContainerStyle('email')}>
              <Feather name="mail" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="you@example.com"
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
                placeholder="Create a password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          <Pressable
            testID="submit-btn"
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: colors.primary,
                opacity: isSubmitting ? 0.62 : pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold' }]}>
              {isSubmitting ? 'Creating...' : 'Create Family'}
            </Text>
          </Pressable>

          {message ? (
            <Text
              style={[
                styles.messageText,
                {
                  color: isSuccessMessage ? colors.accentTeal : colors.destructive,
                  fontFamily: 'Inter_500Medium',
                },
              ]}
            >
              {message}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push('/sign-in')}>
            <Text style={[styles.footerLink, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Sign in
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
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  header: { marginBottom: 24 },
  title: { fontSize: 32, marginBottom: 8 },
  subtitle: { fontSize: 15 },
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
  submitButton: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitButtonText: { fontSize: 16 },
  messageText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 40 },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15 },
});
