import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

/**
 * `/write` is only ever an entry point — redirect to the first step, carrying any
 * `placeId` through so "Write Your Experience" on a place page arrives with that
 * place already chosen.
 */
export default function WriteIndex() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();

  useEffect(() => {
    router.replace(placeId ? `/write/place?placeId=${placeId}` : '/write/place');
  }, [placeId]);

  return <View className="flex-1 bg-paper-100" />;
}
