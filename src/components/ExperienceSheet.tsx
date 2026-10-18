import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
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

/** Review text is clamped in the collapsed state; this is the unclamped cap. */
const EXPANDED_REVIEW_LINES = 6;
const THUMB = 52;
const MAX_THUMBS = 4;

/**
 * README §10 — tapping a marker opens the review, not just the place it happens to
 * sit at. Several reviews can share a coordinate, so a place summary cannot
 * represent what the user actually tapped.
 *
 * This is a sheet on top of a map, so every row it carries is map the user cannot
 * see. It therefore collapses to a single summary line, and the detail is one tap
 * away — being able to see the thing you are panning around matters more than
 * reading a review in place.
 */
export function ExperienceSheet({
  experience,
  onOpenExperience,
  onOpenPlace,
  onOpenReviewer,
}: ExperienceSheetProps) {
  const { place, reviewer, relationship } = experience;
  const [expanded, setExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);

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

  if (!expanded) {
    // One tap to see it all, one more to get the map back. This is the state the
    // sheet spends most of its time in.
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        accessibilityRole="button"
        accessibilityLabel={`${place.name} by ${reviewer.name}, rated ${experience.rating}. Show more.`}
        className="bg-paper-100 px-4 pb-3 pt-2.5 active:opacity-80">
        <View className="h-1 w-9 self-center rounded-pill bg-sand-400" />
        {titleRow}
        {reviewerRow}
        <View className="mt-2 flex-row items-center gap-1.5">
          <Text className="font-body text-[11px] text-ink-400">{exploreCopy.tapForReview}</Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color="#b8a37c" />
        </View>
      </Pressable>
    );
  }

  return (
    <View className="bg-paper-100 px-4 pb-3 pt-2.5">
      <View className="h-1 w-9 self-center rounded-pill bg-sand-400" />

      {titleRow}
      {reviewerRow}

      {/* The review is the point of this sheet, so it is clamped rather than
          unbounded — the full text lives on the experience itself. */}
      <Pressable
        onPress={() => setReviewExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={exploreCopy.expandReview}
        className="mt-2 active:opacity-70">
        <Text
          numberOfLines={reviewExpanded ? undefined : EXPANDED_REVIEW_LINES}
          className="font-body text-[13.5px] leading-[20px] text-ink-700">
          {experience.review}
        </Text>
      </Pressable>

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

        {/* Collapse control sits with the actions rather than floating: the map
            is what the user wants back, not a chrome button. */}
        <Pressable
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel={exploreCopy.collapseSheet}
          className="h-11 w-11 items-center justify-center rounded-card border border-hairline active:opacity-70">
          <MaterialCommunityIcons name="chevron-down" size={18} color="#6b6058" />
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
