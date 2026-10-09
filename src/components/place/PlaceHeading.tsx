import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Stars } from '@/components/Stars';

type PlaceHeadingProps = {
  name: string;
  categoryLabel: string;
  city: string;
  address: string;
  rating: number | null;
  experienceCount: number;
  experienceCountLabel: (n: number) => string;
  ratingLabel: (r: number) => string;
  /** The API has no open/closed state, so this is passed through as unknown. */
  openNow: boolean | null;
};

/**
 * Only fields the API actually returns. There is no opening-hours field and no
 * review count — `experienceCount` is viewer-aware, so it is labelled as
 * "experiences you can see" rather than presented as a total.
 */
export function PlaceHeading({
  name,
  categoryLabel,
  city,
  address,
  rating,
  experienceCount,
  experienceCountLabel,
  ratingLabel,
  openNow,
}: PlaceHeadingProps) {
  return (
    <View className="px-4 pt-5">
      <Text className="font-display text-[27px] leading-8 text-ink-800">{name}</Text>

      <View className="mt-2 flex-row items-center">
        <Text className="font-body text-[13px] text-ink-500">{categoryLabel}</Text>
        {city ? <Text className="font-body text-[13px] text-ink-500">{` · ${city}`}</Text> : null}

        {/* Omitted entirely rather than guessed at. */}
        {openNow === true && (
          <>
            <Text className="font-body text-[13px] text-ink-300"> • </Text>
            <View className="h-1.5 w-1.5 rounded-pill bg-success-500" />
            <Text className="ml-1.5 font-body-medium text-[13px] text-success-600">Open now</Text>
          </>
        )}
      </View>

      {rating !== null && (
        <View className="mt-3 flex-row items-center gap-2">
          <Stars rating={rating} size={14} gap={2} />
          <Text className="font-body-bold text-[13px] text-ink-800">{rating.toFixed(1)}</Text>
          <Text className="font-body text-[12px] text-ink-400">{ratingLabel(rating)}</Text>
        </View>
      )}

      <View className="mt-3 flex-row items-center gap-2">
        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#a03246" />
        <Text className="flex-1 font-body text-[13px] text-ink-700">{address}</Text>
      </View>

      {experienceCount > 0 && (
        <View className="mt-3 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-pill bg-moss-500" />
          <Text className="font-body text-[12px] text-ink-500">
            {experienceCountLabel(experienceCount)}
          </Text>
        </View>
      )}
    </View>
  );
}
