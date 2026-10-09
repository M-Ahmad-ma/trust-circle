import { useState } from 'react';
import { router } from 'expo-router';

import { authApi } from '@/api';
import { fieldErrors, hasCode } from '@/api/errors';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
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
  const [serverError, setServerError] = useState<string | null>(null);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const canSubmit = validateEmail(email) === null && validatePassword(password) === null;

  const submit = async () => {
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setBusy(true);
    setServerError(null);

    try {
      await authApi.login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      if (hasCode(error, 'INVALID_CREDENTIALS')) {
        // Same message for unknown email and wrong password, by design — do not
        // leak which one it was.
        setServerError(authCopy.invalidCredentials);
      } else {
        const fields = fieldErrors(error);
        setServerError(fields.email ?? fields.password ?? authCopy.loginFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  console.log(serverError);

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
          <View className="px-6">
            <StepMarker current={1} total={2} />
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
                <AuthLink onPress={() => { }}>{authCopy.forgotPassword}</AuthLink>
              </View>
            </View>
          </View>

          {serverError && (
            <View className="mt-6 px-6">
              <View className="rounded-card bg-rose-100 p-3.5">
                <Text className="font-body text-[12px] leading-[18px] text-primary-700">
                  {serverError}
                </Text>
              </View>
            </View>
          )}

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
            <AuthLink onPress={() => router.replace('/(auth)/register')}>
              {authCopy.createOne}
            </AuthLink>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
