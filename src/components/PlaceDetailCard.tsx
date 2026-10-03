import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { ResolvedPlace } from '@/types';
import { MonogramStack } from './MonogramStack';
import { Stars } from './Stars';

type PlaceDetailCardProps = {
  place: ResolvedPlace;
  onViewPlace: () => void;
};

export function PlaceDetailCard({ place, onViewPlace }: PlaceDetailCardProps) {
  const circleCount = place.visitedBy.length;

  return (
    <View className="bg-paper-100 px-4 pb-5 pt-2.5">
      {/* Drag handle */}
      <View className="mb-3 items-center">
        <View className="h-1 w-10 rounded-pill bg-sand-400" />
      </View>

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-display text-[19px] leading-6 text-ink-800">{place.name}</Text>
          <Text className="mt-1 font-body text-[12px] text-ink-500">
            {place.categoryLabel}
            <Text className="text-ink-300"> · </Text>
            {place.distanceKm.toFixed(1)} km
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Sort and filter this place"
          className="h-9 w-9 items-center justify-center rounded-pill bg-surface">
          <MaterialCommunityIcons name="tune-variant" size={16} color="#6b6058" />
        </Pressable>
      </View>

      {/* Seal, if this place is a circle favourite */}
      {place.seal && (
        <View className="mt-3 flex-row items-center gap-1.5 self-start rounded-pill bg-accent-50 px-2.5 py-1">
          <MaterialCommunityIcons name="seal-variant" size={12} color="#a06c22" />
          <Text className="font-body-semibold text-[10px] text-accent-700">{place.seal}</Text>
        </View>
      )}

      {/* Rating */}
      <View className="mt-3 flex-row items-center gap-2">
        <Stars rating={place.rating} size={14} />
        <Text className="font-body-bold text-[13px] text-ink-800">{place.rating.toFixed(1)}</Text>
        <Text className="font-body text-[12px] text-ink-400">{place.reviews} reviews</Text>
      </View>

      {/* Circle provenance */}
      <View className="mt-4 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2 pr-3">
          <View className="h-1.5 w-1.5 rounded-pill bg-primary-600" />
          <Text className="flex-1 font-body text-[12px] text-ink-700">
            {circleCount} {circleCount === 1 ? 'person' : 'people'} in your Circle visited
          </Text>
        </View>
        <MonogramStack people={place.visitedBy} size={27} max={4} />
      </View>

      {/* Primary action */}
      <Pressable
        onPress={onViewPlace}
        accessibilityRole="button"
        className="mt-5 flex-row items-center justify-center gap-2 rounded-card bg-primary-600 active:bg-primary-700"
        style={{
          height: 52,
          shadowColor: '#6e1f2a',
          shadowOpacity: 0.28,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 4,
        }}>
        <Text className="font-body-semibold text-[14px] text-primary-fg">View Place</Text>
        <MaterialCommunityIcons name="arrow-right" size={17} color="#fdfaf4" />
      </Pressable>
    </View>
  );
}
