import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import type { LocationStatus } from '@/lib/useUserLocation';

type LocationBannerProps = {
  status: LocationStatus;
  /** False once the OS has stopped prompting — the banner must route to Settings. */
  canAskAgain: boolean;
  onEnable: () => void;
};

/**
 * Without this the map silently frames Peshawar for someone standing in
 * Islamabad, and a distance of "4.2 km away" reads as true. The banner is the
 * honest version of the fallback: the map still works, but it says plainly that
 * it does not know where you are.
 */
export function LocationBanner({ status, canAskAgain, onEnable }: LocationBannerProps) {
  // A fix in hand, or still being asked for, needs no explanation.
  if (status === 'granted' || status === 'idle' || status === 'requesting') return null;

  const label =
    status === 'unavailable'
      ? 'Showing Peshawar. Location services are off on this device.'
      : canAskAgain
        ? 'Showing Peshawar. Turn on location to see what is near you.'
        : 'Showing Peshawar. Location is off for Trust Circle.';

  return (
    <Pressable
      onPress={onEnable}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="mx-4 mb-2 flex-row items-center gap-2.5 rounded-card bg-ink-800/90 px-3.5 py-2.5 active:opacity-80">
      <MaterialCommunityIcons name="map-marker-off-outline" size={16} color="#f3ecdd" />
      <Text className="flex-1 font-body text-[11.5px] leading-[17px] text-paper-50">{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#b8a37c" />
    </Pressable>
  );
}
