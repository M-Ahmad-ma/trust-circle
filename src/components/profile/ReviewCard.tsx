import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { Monogram } from '@/components/Monogram';
import { photo } from '@/theme/photoMap';
import type { Profile, ProfileReview } from '@/types';

const AVATAR = 40;
const PHOTO = 112;
const PHOTO_GAP = 8;
type ReviewCardProps = {
  review: ProfileReview;
  profile: Profile;
  circleLabel: string;
  helpfulLabel: string;
  helpful: Record<string, boolean>;
  onToggleHelpful: (id: string) => void;
  onOpenPlace: (placeId: string) => void;
};

export function ReviewCard({
  review,
  profile,
  circleLabel,
  helpfulLabel,
  helpful,
  onToggleHelpful,
  onOpenPlace,
}: ReviewCardProps) {
  const marked = helpful[review.id] ?? false;

  return (
    <View className="rounded-card border border-hairline bg-paper-50 px-5 pb-4 pt-4">
      <View className="flex-row items-center">
        <Monogram
          initials={profile.initials}
          tint={profile.tint}
          size={AVATAR}
          ringColor="#fdfaf4"
          ringWidth={2}
        />

        <View className="ml-3 flex-1">
          <Text className="font-body-semibold text-[14px] text-ink-900">{profile.name}</Text>
          <View className="mt-1.5 flex-row items-center gap-1.5 self-start rounded-pill bg-rose-100 px-2.5 py-1">
            <View className="h-1.5 w-1.5 rounded-pill bg-primary-600" />
            <Text className="font-body-semibold text-[10.5px] text-primary-600">{circleLabel}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="star" size={16} color="#a03246" />
          <Text className="font-body-bold text-[14px] text-ink-900">
            {review.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Text className="mt-4 font-body text-[14px] leading-[23px] text-ink-700">{review.body}</Text>

      <View className="mt-3 flex-row" style={{ gap: PHOTO_GAP }}>
        {review.photos.map((key) => (
          <Pressable
            key={key}
            onPress={() => onOpenPlace(review.placeId)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo from ${review.placeName}`}
            className="overflow-hidden rounded-[12px] active:opacity-80"
            style={{ width: PHOTO, height: PHOTO }}>
            <Image
              source={photo(key)}
              style={{ width: PHOTO, height: PHOTO }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </Pressable>
        ))}
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Text className="font-body-semibold text-2xs uppercase text-ink-400">{review.time}</Text>

        <Pressable
          onPress={() => onToggleHelpful(review.id)}
          accessibilityRole="button"
          accessibilityState={{ selected: marked }}
          accessibilityLabel={
            marked
              ? `${helpfulLabel} — marked (${review.helpful + 1})`
              : `${helpfulLabel} (${review.helpful})`
          }
          hitSlop={8}
          className="flex-row items-center gap-1.5 active:opacity-60">
          <Text
            className={
              marked
                ? 'font-body-bold text-[12px] text-primary-700'
                : 'font-body-semibold text-[12px] text-primary-600'
            }>
            {helpfulLabel}
          </Text>
          <MaterialCommunityIcons
            name={marked ? 'thumb-up' : 'thumb-up-outline'}
            size={14}
            color={marked ? '#7e2534' : '#a03246'}
          />
        </Pressable>
      </View>
    </View>
  );
}
