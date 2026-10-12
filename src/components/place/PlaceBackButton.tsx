import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { placeCopyApi } from '@/data';

/**
 * Back control for the place detail screen, which has no top bar of its own —
 * its content starts straight into the hero photo.
 *
 * The dark scrim matters twice over: it keeps the white arrow readable against
 * the photo, and it keeps it readable against the pale paper after the user has
 * scrolled the hero away. A bare white arrow would vanish in that second case.
 *
 * `canGoBack` guards the deep-link path, where this screen can be the entry
 * point with nothing to pop — `router.back()` there would either no-op or close
 * the app, stranding the user on a screen with no other way out.
 */
export function PlaceBackButton({ topInset }: { topInset: number }) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
      accessibilityRole="button"
      accessibilityLabel={placeCopyApi.back}
      hitSlop={10}
      className="absolute left-4 h-9 w-9 items-center justify-center rounded-full bg-black/40 active:opacity-70"
      style={{ top: topInset + 8 }}>
      <MaterialCommunityIcons name="arrow-left" color="white" size={20} />
    </Pressable>
  );
}
