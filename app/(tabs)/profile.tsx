import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { usersApi, placesApi } from '@/api';
import { LoadingState } from '@/components/EmptyState';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useApiQuery } from '@/lib/useApiQuery';

/**
 * The Profile tab renders the signed-in user inline. It deliberately does not
 * push `/profile/me`: back would return here, which would push again.
 */
export default function ProfileTab() {
  const [resolveError, setResolveError] = useState<string | null>(null);

  const fetchMeId = useCallback(async () => {
    try {
      const me = await usersApi.me();
      return me.id;
    } catch {
      setResolveError('We could not load your profile.');
      return null;
    }
  }, []);

  const me = useApiQuery(fetchMeId, {
    key: 'me-id',
    errorMessage: 'We could not load your profile.',
  });

  if (!me.data) {
    return (
      <View className="flex-1 bg-paper-100">
        {me.status === 'error' || resolveError ? (
          <View className="flex-1 items-center justify-center">
            <LoadingState label={me.status === 'error' ? me.message : (resolveError ?? '')} />
          </View>
        ) : (
          <LoadingState label="Loading your profile…" />
        )}
      </View>
    );
  }

  return (
    <ProfileScreen
      userId={me.data}
      onBack={() => router.navigate('/')}
      onOpenPlace={(placeId) => {
        void placesApi.getPlace(placeId).then(
          () => router.push(`/place/${placeId}`),
          () => router.push('/')
        );
      }}
    />
  );
}
