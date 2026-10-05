import { Stack } from 'expo-router';

import { authCopy } from '@/data';

/** Auth screens carry their own headers, so the navigator chrome stays off. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#faf5ec' },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="login" options={{ title: authCopy.signIn }} />
      <Stack.Screen name="register" options={{ title: authCopy.createAccount }} />
    </Stack>
  );
}
