import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { ResolvedPlace } from '@/types';
import { MonogramStack } from './MonogramStack';
import { Stars } from './Stars';

type PlaceListProps = {
  places: ResolvedPlace[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyMessage: string;
};

export function PlaceList({ places, selectedId, onSelect, emptyMessage }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-sand-300 px-8">
        <MaterialCommunityIcons name="map-search-outline" size={26} color="#9a8e85" />
        <Text className="text-center font-display-semibold text-[15px] text-ink-600">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-sand-300"
      contentContainerStyle={{ padding: 12, paddingTop: 56, gap: 8 }}
      showsVerticalScrollIndicator={false}>
      {places.map((place) => {
        const active = place.id === selectedId;

        return (
          <Pressable
            key={place.id}
            onPress={() => onSelect(place.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="rounded-card border bg-paper-50 p-3 active:opacity-70"
            style={{ borderColor: active ? '#8e2c39' : '#e0d2b4' }}>
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-2 font-display-semibold text-[15px] text-ink-800">
                {place.name}
              </Text>
              <Text className="font-body-medium text-[11px] text-ink-400">
                {place.distanceKm.toFixed(1)} km
              </Text>
            </View>

            <Text className="mt-1 font-body text-[11px] text-ink-500">
              {place.categoryLabel}
              <Text className="text-ink-300"> · </Text>
              {place.neighbourhood}
            </Text>

            <View className="mt-2.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Stars rating={place.rating} size={11} gap={1.5} />
                <Text className="font-body-semibold text-[11px] text-ink-700">
                  {place.rating.toFixed(1)}
                </Text>
                <Text className="font-body text-[10px] text-ink-400">({place.reviews})</Text>
              </View>

              <View className="flex-row items-center gap-2">
                {place.visitedBy.length > 0 && (
                  <MonogramStack people={place.visitedBy} size={20} max={3} />
                )}
                <View
                  className={`h-1.5 w-1.5 rounded-pill ${place.openNow ? 'bg-moss-500' : 'bg-ink-300'}`}
                />
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
