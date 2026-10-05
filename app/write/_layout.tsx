import { Stack } from 'expo-router';

import { ExperienceDraftProvider } from '@/lib/experienceDraft';

/**
 * One draft spans every step, so the provider sits above the whole stack and
 * survives each individual push.
 */
export default function WriteLayout() {
  return (
    <ExperienceDraftProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#faf5ec' },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}>
        <Stack.Screen name="place" />
        <Stack.Screen name="photo" />
        <Stack.Screen name="rating" />
        <Stack.Screen name="story" />
        <Stack.Screen name="date" />
        <Stack.Screen name="visibility" />
        <Stack.Screen name="preview" options={{ gestureEnabled: false }} />
      </Stack>
    </ExperienceDraftProvider>
  );
}
