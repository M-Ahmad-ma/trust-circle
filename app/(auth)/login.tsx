import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackdrop } from '@/components/auth/AuthBackdrop';
import { AuthButton, AuthLink, StepMarker } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { PasswordField } from '@/components/auth/PasswordField';
import { authCopy } from '@/data';
import { validateEmail, validatePassword } from '@/lib/validation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [busy, setBusy] = useState(false);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const canSubmit = validateEmail(email) === null && validatePassword(password) === null;

  const submit = () => {
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setBusy(true);
    // No auth backend yet — hand off to the app so the flow is walkable.
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-paper-100">
      <AuthBackdrop />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
          <View className="flex-row items-center justify-between px-6">
            <StepMarker current={1} total={2} />
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel={authCopy.browseAsGuest}
              hitSlop={8}
              className="active:opacity-60">
              <Text className="font-body-semibold text-3xs uppercase text-ink-400">
                {authCopy.browseAsGuest}
              </Text>
            </Pressable>
          </View>

          <View className="px-6 pt-10">
            <Text className="font-body-semibold text-2xs uppercase text-primary-600">
              {authCopy.loginEyebrow}
            </Text>

            <Text className="mt-3 font-display text-[34px] leading-[38px] text-ink-900">
              Welcome <Text className="font-display-italic text-primary-600">back</Text>.
            </Text>

            <Text className="mt-3 max-w-[300px] font-body text-[13px] leading-[19px] text-ink-500">
              {authCopy.loginSubtitle}
            </Text>
          </View>

          <View className="mt-9 gap-6 px-6">
            <AuthField
              label={authCopy.emailLabel}
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <View>
              <PasswordField
                label={authCopy.passwordLabel}
                value={password}
                onChange={setPassword}
                onSubmitEditing={submit}
                error={passwordError}
                hint={!passwordError && password.length > 0 ? authCopy.passwordHint : null}
              />

              <View className="mt-2 self-end">
                <AuthLink onPress={() => {}}>{authCopy.forgotPassword}</AuthLink>
              </View>
            </View>
          </View>

          <View className="mt-8 px-6">
            <AuthButton
              label={authCopy.signIn}
              icon="arrow-right"
              onPress={submit}
              disabled={!canSubmit}
              busy={busy}
            />
          </View>

          <View className="mt-7 flex-row items-center justify-center gap-1.5">
            <Text className="font-body text-[13px] text-ink-500">{authCopy.noAccount}</Text>
            <AuthLink onPress={() => router.replace('/register')}>{authCopy.createOne}</AuthLink>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
