import { useState } from 'react';
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
 * `avatarPath` deliberately keeps the API's own name so every wire-shaped user
 * (`SlimUser`, `AuthUser`) can be passed straight in. Renaming it here would let
 * a caller hand in a `SlimUser` that satisfies this type while carrying no photo
 * at all, and TypeScript would not catch it — the field is optional.
 */
export function Avatar({ user, size = 32, ringColor, ringWidth = 0, tintOverride }: AvatarProps) {
  const uri = absoluteUrl(user.avatarPath);
  // A path that resolves but 404s, or a URL the device cannot reach, would
  // otherwise leave a blank circle. Sticky rather than per-render, so a failing
  // image does not retry on every parent re-render.
  const [imageFailed, setImageFailed] = useState(false);

  if (uri && !imageFailed) {
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
        onError={() => setImageFailed(true)}
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
