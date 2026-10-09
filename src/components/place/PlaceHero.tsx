import { Image, View } from 'react-native';

import { absoluteUrl } from '@/api/session';

const HERO_HEIGHT = 208;

/**
 * Place cover image. `coverPhoto` is resolved server-side from the newest experience
 * at this place that the current viewer is allowed to see, so it is already
 * viewer-safe — this component only resolves the relative path against the API host.
 *
 * Renders nothing when there is no visible photo (a place can legitimately have none
 * for this viewer — see the Saidu Sharif case in docs/API.md), so callers must treat
 * "no hero" as a normal state rather than an error.
 */
export function PlaceHero({ coverPhoto }: { coverPhoto?: string | null }) {
  const uri = absoluteUrl(coverPhoto);
  if (!uri) return null;

  return (
    <View className="bg-paper-200">
      <Image
        source={{ uri }}
        style={{ height: HERO_HEIGHT, width: '100%' }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** True when a hero will actually render, so the status bar can pick a legible style. */
export function hasHero(coverPhoto?: string | null): boolean {
  return absoluteUrl(coverPhoto) !== null;
}
