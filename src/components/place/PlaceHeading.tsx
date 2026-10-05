import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Stars } from '@/components/Stars';

type PlaceHeadingProps = {
  name: string;
  categoryLabel: string;
  city: string;
  openNow: boolean;
  closesAt: string;
  rating: number;
  reviews: number;
  address: string;
};

export function PlaceHeading({
  name,
  categoryLabel,
  city,
  openNow,
  closesAt,
  rating,
  reviews,
  address,
}: PlaceHeadingProps) {
  return (
    <View className="px-4 pt-5">
      <Text className="font-display text-[27px] leading-8 text-ink-800">{name}</Text>

      <View className="mt-2 flex-row items-center">
        <Text className="font-body text-[13px] text-ink-500">{categoryLabel}</Text>
        <Text className="font-body text-[13px] text-ink-300"> · </Text>
        <Text className="font-body text-[13px] text-ink-500">{city}</Text>
        <Text className="font-body text-[13px] text-ink-300"> • </Text>
        <View className="h-1.5 w-1.5 rounded-pill bg-success-500" />
        <Text className="ml-1.5 font-body-medium text-[13px] text-success-600">
          {openNow ? 'Open now' : closesAt}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Stars rating={rating} size={14} gap={2} />
        <Text className="font-body-bold text-[13px] text-ink-800">{rating.toFixed(1)}</Text>
        <Text className="font-body text-[12px] text-ink-400">({reviews} reviews)</Text>
      </View>

      <View className="mt-3.5 flex-row items-center gap-2">
        <MaterialCommunityIcons name="map-marker-outline" size={16} color="#a03246" />
        <Text className="flex-1 font-body text-[13px] text-ink-700">{address}</Text>
      </View>
    </View>
  );
}
