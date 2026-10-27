import { Image, Pressable, Text, View } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { ExperienceCard } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { Stars } from '@/components/Stars';
import { RelationshipBadge } from '@/components/write/Relationship';
import { formatVisitDate } from '@/components/write/VisitCalendar';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * An experience exactly as the API returned it — reviewer, viewer-relative
 * relationship, photos and all. Nothing here is inferred.
 */
export function ExperienceRow({
  experience,
  onOpen,
  onOpenReviewer,
}: {
  experience: ExperienceCard;
  onOpen?: () => void;
  /**
   * Makes the reviewer block tappable. Omitted where the reviewer is already
   * who you are looking at, so there is no dead target that navigates to the
   * screen you are on — see the callers for why that is not a formality.
   */
  onOpenReviewer?: () => void;
}) {
  const photos = experience.photos
    .map((photo) => ({ id: photo.id, uri: absoluteUrl(photo.url) }))
    .filter((photo): photo is { id: string; uri: string } => photo.uri !== null);

  return (
    <Pressable
      onPress={onOpen}
      disabled={!onOpen}
      accessibilityRole={onOpen ? 'button' : undefined}
      accessibilityLabel={onOpen ? 'Open experience' : undefined}
      className="overflow-hidden rounded-card border border-hairline bg-paper-50">
      <View className="flex-row items-center px-4 pt-4">
        {/* Nested Pressable: React Native hands the touch responder to the
            deepest handler, so this wins over the card's own onPress without
            cancelling it — the rest of the card still opens the experience. */}
        <Pressable
          onPress={onOpenReviewer}
          disabled={!onOpenReviewer}
          accessibilityRole={onOpenReviewer ? 'button' : undefined}
          accessibilityLabel={
            onOpenReviewer ? `View ${experience.reviewer.name}'s profile` : undefined
          }
          className="flex-1 flex-row items-center active:opacity-70">
          <Avatar user={experience.reviewer} size={38} ringColor="#fdfaf4" ringWidth={2} />

          <View className="ml-3 flex-1">
            <Text numberOfLines={1} className="font-body-semibold text-[13.5px] text-ink-900">
              {experience.reviewer.name}
            </Text>
            <View className="mt-1.5">
              <RelationshipBadge
                relationship={experience.relationship.type}
                label={experience.relationship.label}
                size="sm"
              />
            </View>
          </View>
        </Pressable>

        <View className="items-end gap-1">
          <Stars rating={experience.rating} size={14} />
          <Text className="font-body text-[10.5px] text-ink-400">
            {formatVisitDate(experience.visitedAt)}
          </Text>
        </View>
      </View>

      <Text className="px-4 pt-4 font-body text-[13.5px] leading-[22px] text-ink-700">
        {experience.review}
      </Text>

      {photos.length > 0 && (
        <View className="mt-3 flex-row px-3" style={{ gap: 8 }}>
          {photos.slice(0, 3).map((photo) => (
            <Image
              key={photo.id}
              source={{ uri: photo.uri }}
              style={{ width: 96, height: 96, borderRadius: 12 }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-body text-[10.5px] uppercase tracking-widest text-ink-300">
          {formatVisitDate(experience.visitedAt)}
        </Text>
        <MaterialIcons name="chevron-right" size={19} color="#a03246" />
        {/* {onOpen && <Text className="font-body-semibold text-[11.5px] text-primary-600">Open</Text>} */}
      </View>
    </Pressable>
  );
}
