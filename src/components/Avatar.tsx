import { Image } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { AvatarUser } from '@/types';
import { Monogram } from './Monogram';
import { initialsFrom } from '@/lib/validation';

/**
 * Monogram tints, keyed by a stable hash of the user id. Deterministic so a
 * person keeps the same colour on every screen, and server-independent —
 * the API has no tint field, so this must never depend on one.
 */
const TINTS = [
  '#a03246',
  '#4a6b52',
  '#c08a2e',
  '#6e5a86',
  '#a0695a',
  '#d6a59f',
  '#799b91',
  '#be883a',
];

export function tintForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % TINTS.length;
  return TINTS[hash];
}

type AvatarProps = {
  user: AvatarUser;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
  /** Overrides the derived tint — used by the registration preview. */
  tintOverride?: string;
};

/**
 * Renders the user's photo when they have one, otherwise falls back to a monogram
 * derived from their name. Seeded and most real users have no photo, so the
 * monogram path is the common case, not the fallback.
 *
 * The photo arrives as `user.coverPhoto`, mapped from the API's `avatarPath` by
 * the caller — the wire name and the view name differ on purpose.
 */
export function Avatar({ user, size = 32, ringColor, ringWidth = 0, tintOverride }: AvatarProps) {
  const uri = absoluteUrl(user.coverPhoto);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: ringColor ?? 'transparent',
        }}
        accessibilityIgnoresInvertColors
        accessibilityLabel={`${user.name}'s avatar`}
      />
    );
  }

  return (
    <Monogram
      initials={initialsFrom(user.name)}
      tint={tintOverride ?? tintForId(user.id)}
      size={size}
      ringColor={ringColor}
      ringWidth={ringWidth}
    />
  );
}
