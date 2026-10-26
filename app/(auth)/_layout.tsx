import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/useSession';

/** Auth screens carry their own headers, so the navigator chrome stays off. */
export default function AuthLayout() {
  const { isAuthenticated } = useSession();

  // Signing in sets the session, which makes `isAuthenticated` true. Without this
  // the stack would stay on the form the user just completed.
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#faf5ec' },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="login" options={{ title: 'Sign in' }} />
      <Stack.Screen name="register" options={{ title: 'Create account' }} />
    </Stack>
  );
}
