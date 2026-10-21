import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

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

/** Thumbnail size for the photo strip, and how many thumbs fit before it wraps. */
const THUMB = 52;
const MAX_THUMBS = 4;

/**
 * README §10 — tapping a marker opens the review, not just the place it happens to
 * sit at. Several reviews can share a coordinate, so a place summary cannot
 * represent what the user actually tapped.
 *
 * This is a sheet on top of a map, so it covers map the user cannot see. It used
 * to collapse to a single summary line and expand on tap, but that cost an extra
 * tap to read the thing the marker was tapped for. The sheet now shows the
 * review outright, and the map keeps whatever space is left.
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
    .slice(0, MAX_THUMBS)
    .map((photo) => ({ id: photo.id, uri: absoluteUrl(photo.url) }))
    .filter((photo): photo is { id: string; uri: string } => photo.uri !== null);

  const reviewerRow = (
    <Pressable
      onPress={onOpenReviewer}
      accessibilityRole="button"
      accessibilityLabel={reviewer.name}
      hitSlop={6}
      className="mt-2 flex-row items-center gap-2 self-start rounded-pill py-0.5 pr-2 active:opacity-70">
      <Avatar user={reviewer} size={22} />
      <Text className="font-body-semibold text-[12.5px] text-ink-800">{reviewer.name}</Text>
      <RelationshipBadge
        relationship={relationship.type}
        label={relationship.label}
        compact
        size="sm"
      />
      <Text numberOfLines={1} className="font-body text-[11px] text-ink-400">
        {formatVisitDate(experience.visitedAt)}
      </Text>
    </Pressable>
  );

  const titleRow = (
    <View className="mt-2 flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <Text numberOfLines={1} className="font-display text-[18px] leading-5 text-ink-800">
          {place.name}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 font-body text-[11.5px] text-ink-500">
          {place.category ?? exploreCopy.place}
          {place.city ? ` · ${place.city}` : ''}
          {distance ? ` · ${distance}` : ''}
        </Text>
      </View>

      <View className="flex-row items-center gap-1.5 pt-0.5">
        <Stars rating={experience.rating} size={12} gap={1} />
        <Text className="font-body-bold text-[12.5px] text-ink-800">
          {experience.rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="bg-paper-100 px-4 pb-3 pt-2.5">
      <View className="h-1 w-9 self-center rounded-pill bg-sand-400" />

      {titleRow}
      {reviewerRow}

      {/* The review is the point of this sheet, so it is shown in full rather
          than clamped behind a "show more" tap. */}
      <Text className="mt-2 font-body text-[13.5px] leading-[20px] text-ink-700">
        {experience.review}
      </Text>

      {photos.length > 0 && <ScrollableThumbs photos={photos} onPress={onOpenExperience} />}

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={onOpenPlace}
          accessibilityRole="button"
          className="h-11 flex-1 items-center justify-center rounded-card border border-primary-600 active:bg-rose-100">
          <Text className="font-body-semibold text-[13.5px] text-primary-600">
            {exploreCopy.viewPlace}
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenExperience}
          accessibilityRole="button"
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-card bg-primary-600 active:bg-primary-700">
          <Text className="font-body-semibold text-[13.5px] text-primary-fg">
            {exploreCopy.openExperience}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#fdfaf4" />
        </Pressable>
      </View>
    </View>
  );
}

function ScrollableThumbs({
  photos,
  onPress,
}: {
  photos: { id: string; uri: string }[];
  onPress: () => void;
}) {
  return (
    <View className="mt-2.5 flex-row gap-1.5">
      {photos.map((photo) => (
        <Pressable
          key={photo.id}
          onPress={onPress}
          accessibilityRole="imagebutton"
          accessibilityLabel={exploreCopy.openExperience}
          className="overflow-hidden rounded-[8px] bg-surface active:opacity-70">
          <Image
            source={{ uri: photo.uri }}
            style={{ width: THUMB, height: THUMB }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      ))}
    </View>
  );
}
