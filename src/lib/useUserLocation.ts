import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { log } from '@/api/logger';
import { peshawarOverview } from '@/theme/mapStyle';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export type Coords = { lat: number; lng: number };

export type UserLocation = {
  status: LocationStatus;
  /** A real fix, or the Peshawar fallback. Always usable — callers never branch. */
  coords: Coords;
  /** True when `coords` is the fallback, i.e. we do not know where the user is. */
  isFallback: boolean;
  /** False once the OS will no longer show a prompt (blocked in Settings). */
  canAskAgain: boolean;
  /** Explicit user-initiated request — the only path that may re-prompt. */
  request: () => void;
  openSettings: () => void;
};

const FALLBACK: Coords = {
  lat: peshawarOverview.latitude,
  lng: peshawarOverview.longitude,
};

/**
 * Coarse accuracy on purpose. Everything the map asks of a fix is "which places
 * are near me" over a 20 km radius, and Balanced is what iOS will report for a
 * user who has deliberately chosen approximate location — asking for High would
 * buy nothing here and cost battery on a screen that stays open.
 */
const ACCURACY = Location.Accuracy.Balanced;

/**
 * Foreground location for the Explore screen, asked contextually rather than at
 * launch: a permission prompt on first open is the one users accept, and a map
 * is a legible reason for it.
 *
 * Degradation is total, not partial — with permission denied the hook still
 * returns usable coordinates (the Peshawar fallback) so no caller needs a
 * "did we get permission" branch, and the Explore screen shows a banner rather
 * than silently framing a map of the wrong city as the user's neighbourhood.
 *
 * Focus drives both halves of the policy: it asks on first open, and re-reads on
 * return because a user who travelled while the app was backgrounded would
 * otherwise keep seeing stale distances. The re-read never re-prompts — only
 * `request()`, wired to an explicit tap, can do that.
 */
export function useUserLocation(): UserLocation {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  // Mirrors permission state for the focus callback without making it a
  // dependency, and remembers that we have already asked so focus never nags.
  const grantedRef = useRef(false);
  const askedRef = useRef(false);

  const resolve = useCallback(async (askPermission: boolean) => {
    try {
      // Both paths yield before touching state, so no caller ever sees a
      // synchronous update — the first render after focus is already correct.
      if (askPermission) {
        const permission = await Location.requestForegroundPermissionsAsync();
        grantedRef.current = permission.granted;

        if (!permission.granted) {
          // `canAskAgain: false` means the OS has stopped showing prompts — the
          // user chose "don't ask again", so the only route left is Settings.
          setCanAskAgain(permission.canAskAgain);
          setStatus('denied');
          log.location.warn('permission denied', { canAskAgain: permission.canAskAgain });
          return;
        }
      }

      setStatus('requesting');

      const position = await Location.getCurrentPositionAsync({ accuracy: ACCURACY });
      grantedRef.current = true;
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setStatus('granted');
      log.location.info('fix acquired');
    } catch (error) {
      // A device with location services switched off, or an emulator with no
      // location set, lands here. Distinct from a denial: the user may well have
      // granted permission and simply has no fix available.
      grantedRef.current = false;
      setCanAskAgain(false);
      setStatus('unavailable');
      log.location.error('fix failed', { error: String(error) });
    }
  }, []);

  /**
   * Focus is the single trigger for both cases, which is why there is no separate
   * mount effect: `useFocusEffect` fires once when the screen first mounts and
   * again every time it regains focus, so "ask on open, refresh on return" is one
   * subscription rather than two that can race.
   */
  useFocusEffect(
    useCallback(() => {
      // Already permitted: refresh the fix. A re-focus must never re-prompt.
      if (grantedRef.current) {
        void resolve(false);
        return;
      }

      // Asked once and not permitted — stop. Someone who said no keeps being asked
      // only by tapping the banner or the recentre button themselves.
      if (askedRef.current) return;

      askedRef.current = true;
      void resolve(true);
    }, [resolve])
  );

  const request = useCallback(() => {
    void resolve(true);
  }, [resolve]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return {
    status,
    coords: coords ?? FALLBACK,
    isFallback: coords === null,
    canAskAgain,
    request,
    openSettings,
  };
}
