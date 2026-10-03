import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Stars } from '@/components/Stars';
import { members, places, viewer } from '@/data';

export default function SavedScreen() {
  const saved = places.slice(0, 4);

  return (
    <Screen className="px-4" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">Your library</Text>
        <Text className="mt-1.5 font-display text-[26px] leading-8 text-ink-800">Saved</Text>
        <Text className="mt-1 font-body text-[12px] text-ink-500">
          {viewer.saved} places kept for later.
        </Text>

        <View className="mt-5 gap-2">
          {saved.map((place) => (
            <View
              key={place.id}
              className="flex-row items-center gap-3 rounded-card border border-sand-400 bg-paper-50 p-3">
              <View className="h-12 w-12 items-center justify-center rounded-card bg-surface">
                <MaterialCommunityIcons name="bookmark" size={19} color="#8e2c39" />
              </View>
              <View className="flex-1">
                <Text className="font-display-semibold text-[14px] text-ink-800">{place.name}</Text>
                <View className="mt-1 flex-row items-center gap-1.5">
                  <Stars rating={place.rating} size={9} gap={1} />
                  <Text className="font-body text-[10px] text-ink-400">
                    {place.categoryLabel} · {place.distanceKm.toFixed(1)} km
                  </Text>
                </View>
              </View>
              <Text className="font-body-medium text-[10px] text-ink-400">
                {place.visitedBy.length}/{members.length}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
