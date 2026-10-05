import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthBackdrop, Rule } from '@/components/auth/AuthBackdrop';
import { AuthButton, AuthLink, StepMarker } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { IdentityPicker } from '@/components/auth/IdentityPicker';
import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { authCopy } from '@/data';
import { validateEmail, validateName, validatePassword } from '@/lib/validation';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tint, setTint] = useState('#a03246');
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [busy, setBusy] = useState(false);

  const nameError = touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;

  const canSubmit =
    validateName(name) === null &&
    validateEmail(email) === null &&
    validatePassword(password) === null &&
    accepted;

  const submit = () => {
    setTouched({ name: true, email: true, password: true });
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
            <StepMarker current={2} total={2} />
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
              {authCopy.registerEyebrow}
            </Text>

            <Text className="mt-3 font-display text-[34px] leading-[38px] text-ink-900">
              Join the <Text className="font-display-italic text-primary-600">circle</Text>.
            </Text>

            <Text className="mt-3 max-w-[310px] font-body text-[13px] leading-[19px] text-ink-500">
              {authCopy.registerSubtitle}
            </Text>
          </View>

          <View className="mt-9 gap-6 px-6">
            <AuthField
              label={authCopy.nameLabel}
              value={name}
              onChangeText={setName}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              error={nameError}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

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
                textContentType="newPassword"
              />
              <PasswordStrength value={password} />
            </View>

            <Rule />

            <IdentityPicker name={name} tint={tint} onTintChange={setTint} />
          </View>

          <View className="mt-8 px-6">
            <Pressable
              onPress={() => setAccepted((current) => !current)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
              accessibilityLabel={authCopy.termsLabel}
              className="flex-row items-start gap-2.5 active:opacity-70">
              <View className="mt-0.5">
                <MaterialCommunityIcons
                  name={accepted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={19}
                  color={accepted ? '#a03246' : '#b8a37c'}
                />
              </View>
              <Text className="flex-1 font-body text-[11.5px] leading-[17px] text-ink-500">
                {authCopy.termsLabel}
              </Text>
            </Pressable>

            <View className="mt-6">
              <AuthButton
                label={authCopy.createAccount}
                icon="arrow-right"
                onPress={submit}
                disabled={!canSubmit}
                busy={busy}
              />
            </View>
          </View>

          <View className="mt-7 flex-row items-center justify-center gap-1.5">
            <Text className="font-body text-[13px] text-ink-500">{authCopy.haveAccount}</Text>
            <AuthLink onPress={() => router.replace('/login')}>{authCopy.signInInstead}</AuthLink>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
