import '../global.css';

import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Sora_300Light,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hydrateSession } from '@/api/session';
import { useSession } from '@/lib/useSession';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Sora_300Light,
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  const [sessionReady, setSessionReady] = useState(false);
  const { isAuthenticated } = useSession();
  const segments = useSegments();

  // Tokens live in SecureStore, so a cold start has no access token until that
  // read resolves. Screens must not mount before then: they would query without
  // an Authorization header, draw the sign-in screen, and then have the stored
  // session cleared out from under them by the 401 that follows.
  useEffect(() => {
    let cancelled = false;
    hydrateSession().finally(() => {
      if (!cancelled) setSessionReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing renders until both gates are open, so no screen ever observes the
  // window where fonts or the session are still loading.
  if (!fontsLoaded || !sessionReady) return null;

  /**
   * When a 401 cannot be recovered — the refresh token is gone or rejected, so
   * `api()` clears the session — send the user to sign in again.
   *
   * The `(tabs)` and `(auth)` layouts already swap on session change, but that
   * only covers screens inside those groups. `/place/[id]`, `/experience/[id]`,
   * `/write`, `/profile/[id]` and friends are root-level Stack screens that kept
   * rendering their last good data with every refresh now failing underneath,
   * which reads as a broken app rather than an expired session. Guarding here
   * covers every entry point at once.
   *
   * Not signed in is only an error *outside* the auth flow. On `(auth)` it is the
   * normal state, and redirecting there would trap the user on a login form.
   */
  if (!isAuthenticated && segments[0] !== '(auth)') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="place/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        {/*
          `place/[id]/edit` is its own route, so it does not inherit the
          `place/[id]` entry above — it fell back to the Stack default and drew
          the native header. The screen already renders its own back button and
          title, so the native one stacked a second bar on top of it.
        */}
        <Stack.Screen
          name="place/[id]/edit"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="write"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="experience/[id]"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen name="profile/search" options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        {/* Both settings screens draw their own back button and title. */}
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="settings/blocked" options={{ headerShown: false }} />
        <Stack.Screen name="dev/logs" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
