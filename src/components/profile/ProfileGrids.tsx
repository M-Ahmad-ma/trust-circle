import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { WirePlace } from '@/api/types';
import { Stars } from '@/components/Stars';

const TILE = 168;

type ProfilePlacesProps = {
  places: WirePlace[];
  onOpen: (placeId: string) => void;
};

/** Places derived from experiences actually returned by the API. */
export function ProfilePlacesGrid({ places, onOpen }: ProfilePlacesProps) {
  return (
    <View className="flex-row flex-wrap px-6">
      {places.map((place) => (
        <Pressable
          key={place.id}
          onPress={() => onOpen(place.id)}
          accessibilityRole="button"
          accessibilityLabel={place.name}
          className="mb-4 mr-4 overflow-hidden rounded-card border border-hairline bg-paper-50 active:opacity-80"
          style={{ width: TILE }}>
          <View className="h-[104px] items-center justify-center bg-surface">
            <MaterialCommunityIcons name="map-marker-outline" size={22} color="#a03246" />
          </View>
          <View className="p-3">
            <Text numberOfLines={1} className="font-body-semibold text-[12.5px] text-ink-900">
              {place.name}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 font-body text-[10.5px] text-ink-400">
              {place.category ?? 'Place'}
              {place.city ? ` · ${place.city}` : ''}
            </Text>
            {typeof place.avgRating === 'number' && (
              <View className="mt-2 flex-row items-center gap-1.5">
                <Stars rating={place.avgRating} size={10} gap={1} />
                <Text className="font-body-semibold text-[10.5px] text-ink-700">
                  {place.avgRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

type ProfilePhotosProps = {
  /** Relative `/uploads/...` paths straight from the API. */
  urls: string[];
};

const CELL = 104;

/** Photos come from the experiences on file — the API stores no photo gallery. */
export function ProfilePhotosGrid({ urls }: ProfilePhotosProps) {
  return (
    <View className="flex-row flex-wrap px-6">
      {urls.map((url, index) => {
        const uri = absoluteUrl(url);
        if (!uri) return null;

        return (
          <Image
            key={`${url}-${index}`}
            source={{ uri }}
            style={{ width: CELL, height: CELL, marginRight: 4, marginBottom: 4, borderRadius: 8 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        );
      })}
    </View>
  );
}
