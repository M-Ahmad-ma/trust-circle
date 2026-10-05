import { Image, Pressable, Text, View } from 'react-native';

import { Stars } from '@/components/Stars';
import { photo } from '@/theme/photoMap';
import type { Place } from '@/types';

type ProfilePlacesProps = {
  places: Place[];
  onOpen: (placeId: string) => void;
};

const TILE = 168;

export function ProfilePlacesGrid({ places, onOpen }: ProfilePlacesProps) {
  return (
    <View className="flex-row flex-wrap px-6">
      {places.map((place) => (
        <Pressable
          key={place.id}
          onPress={() => onOpen(place.id)}
          accessibilityRole="button"
          accessibilityLabel={`${place.name}, ${place.categoryLabel}`}
          className="mb-4 mr-4 overflow-hidden rounded-card border border-hairline bg-paper-50 active:opacity-80"
          style={{ width: TILE }}>
          <Image
            source={photo(place.photos[0])}
            style={{ width: TILE, height: 104 }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View className="p-3">
            <Text numberOfLines={1} className="font-body-semibold text-[12.5px] text-ink-900">
              {place.name}
            </Text>
            <Text className="mt-0.5 font-body text-[10.5px] text-ink-400">
              {place.neighbourhood}
            </Text>
            <View className="mt-2 flex-row items-center gap-1.5">
              <Stars rating={place.rating} size={10} gap={1} />
              <Text className="font-body-semibold text-[10.5px] text-ink-700">
                {place.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

type ProfilePhotosProps = {
  keys: string[];
};

const CELL = 104;

export function ProfilePhotosGrid({ keys }: ProfilePhotosProps) {
  return (
    <View className="flex-row flex-wrap px-6">
      {keys.map((key, index) => (
        <Image
          key={`${key}-${index}`}
          source={photo(key)}
          style={{
            width: CELL,
            height: CELL,
            marginRight: 4,
            marginBottom: 4,
            borderRadius: 8,
          }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ))}
    </View>
  );
}
