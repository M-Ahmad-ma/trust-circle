import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { usersApi } from '@/api';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

/**
 * `/profile/me` resolves to the signed-in user. A static route so it wins over
 * `profile/[id]`, which would otherwise try to load a user whose id is "me".
 */
export default function MyProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  useEffect(() => {
    if (userId) return;

    let cancelled = false;

    (async () => {
      try {
        const me = await usersApi.me();
        if (!cancelled) router.replace(`/profile/${me.id}`);
      } catch {
        // `login` lives in the (auth) group; the bare '/login' path does not
        // resolve and would land on the not-found screen instead.
        if (!cancelled) router.replace('/(auth)/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (userId) {
    return (
      <ProfileScreen
        userId={userId}
        onBack={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
        onOpenPlace={(placeId) => router.push(`/place/${placeId}`)}
      />
    );
  }

  return null;
}
