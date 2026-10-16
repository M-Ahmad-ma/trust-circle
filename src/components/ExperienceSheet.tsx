import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { ExperienceCard } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { Stars } from '@/components/Stars';
import { RelationshipBadge } from '@/components/write/Relationship';
import { formatVisitDate } from '@/components/write/VisitCalendar';
import { exploreCopy } from '@/data';

type ExperienceSheetProps = {
  experience: ExperienceCard;
  onOpenExperience: () => void;
  onOpenPlace: () => void;
  onOpenReviewer: () => void;
};

/**
 * README §10 — tapping a marker opens the review, not just the place it happens to
 * sit at. Several reviews can share a coordinate, so a place summary cannot
 * represent what the user actually tapped.
 */
export function ExperienceSheet({
  experience,
  onOpenExperience,
  onOpenPlace,
  onOpenReviewer,
}: ExperienceSheetProps) {
  const { place, reviewer, relationship } = experience;

  const distance =
    typeof place.distanceM === 'number'
      ? place.distanceM < 1000
        ? `${Math.round(place.distanceM)} m away`
        : `${(place.distanceM / 1000).toFixed(1)} km away`
      : null;

  const photos = experience.photos
    .map((photo) => ({ id: photo.id, uri: absoluteUrl(photo.url) }))
    .filter((photo): photo is { id: string; uri: string } => photo.uri !== null);


  console.log(experience, "experience")

  return (
    <View className="bg-paper-100 px-4 pb-5 pt-3">
      <View className="h-1 w-10 self-center rounded-pill bg-sand-400" />

      <View className="mt-3 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-display text-[19px] leading-6 text-ink-800">{place.name}</Text>
          <Text className="mt-1 font-body text-[12px] text-ink-500">
            {place.category ?? exploreCopy.place}
            {place.city ? ` · ${place.city}` : ''}
            {distance ? ` · ${distance}` : ''}
          </Text>
        </View>

        <View className="items-end gap-1">
          <Stars rating={experience.rating} size={13} gap={1.5} />
          <Text className="font-body-bold text-[13px] text-ink-800">
            {experience.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onOpenReviewer}
        accessibilityRole="button"
        accessibilityLabel={reviewer.name}
        className="mt-3 flex-row items-center gap-2.5 self-start rounded-pill py-0.5 pr-2 active:opacity-70">
        <Avatar user={reviewer} size={26} />
        <Text className="font-body-semibold text-[13px] text-ink-800">{reviewer.name}</Text>
        <RelationshipBadge
          relationship={relationship.type}
          label={relationship.label}
          compact
          size="sm"
        />
      </Pressable>

      {/* The review is the point of this sheet, so it is capped rather than
          unbounded — the full text lives on the experience itself. */}
      <ScrollView
        className="mt-2.5 grow-0"
        style={{ maxHeight: 88 }}
        showsVerticalScrollIndicator={false}>
        <Text className="font-body text-[14px] leading-[21px] text-ink-700">
          {experience.review}
        </Text>
      </ScrollView>

      <View className="mt-2.5 flex-row items-center gap-2">
        <MaterialCommunityIcons name="calendar-check-outline" size={13} color="#6b6058" />
        <Text className="font-body text-[11.5px] text-ink-400">
          {formatVisitDate(experience.visitedAt)}
        </Text>
      </View>

      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 grow-0"
          contentContainerStyle={{ gap: 8 }}>
          {photos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={onOpenExperience}
              accessibilityRole="imagebutton"
              accessibilityLabel={exploreCopy.openExperience}
              className="overflow-hidden rounded-[10px] bg-surface active:opacity-70">
              <Image
                source={{ uri: photo.uri }}
                style={{ width: 72, height: 72 }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View className="mt-4 flex-row gap-2.5">
        <Pressable
          onPress={onOpenPlace}
          accessibilityRole="button"
          className="h-12 flex-1 items-center justify-center rounded-card border border-primary-600 active:bg-rose-100">
          <Text className="font-body-semibold text-[14px] text-primary-600">
            {exploreCopy.viewPlace}
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenExperience}
          accessibilityRole="button"
          className="h-12 flex-1 items-center justify-center rounded-card bg-primary-600 active:bg-primary-700">
          <Text className="font-body-semibold text-[14px] text-primary-fg">
            {exploreCopy.openExperience}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
