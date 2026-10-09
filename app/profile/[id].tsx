import { router, useLocalSearchParams } from 'expo-router';

import { placesApi } from '@/api';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ProfileScreen
      userId={id}
      onBack={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
      onOpenPlace={(placeId) => {
        // Confirm the place exists before pushing, so a stale id cannot land on
        // an empty screen.
        void placesApi.getPlace(placeId).then(
          () => router.push(`/place/${placeId}`),
          () => router.push('/')
        );
      }}
    />
  );
}
