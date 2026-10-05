import { router } from 'expo-router';

import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { places } from '@/data';

/** Viewing someone's profile as a pushed screen, e.g. from their Circle entry. */
export default function ProfileRoute() {
  return (
    <ProfileScreen
      onBack={() => (router.canGoBack() ? router.back() : router.navigate('/'))}
      onOpenPlace={(placeId) => {
        if (places.some((place) => place.id === placeId)) router.push(`/place/${placeId}`);
      }}
      onEditProfile={() => {}}
      onOpenSettings={() => {}}
    />
  );
}
