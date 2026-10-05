import { useState } from 'react';
import type { ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { Monogram } from '@/components/Monogram';
import { Stars } from '@/components/Stars';
import type { Experience, Member } from '@/types';

const CARD_WIDTH = 252;
const CARD_GAP = 12;
const H_PADDING = 16;

type ExperienceCarouselProps = {
  experiences: Experience[];
  authors: Record<string, Member>;
  photos: Record<string, ImageSourcePropType>;
  title: string;
  seeAllLabel: string;
  circleLabel: string;
  onSeeAll: () => void;
  onOpenExperience: (id: string) => void;
};

export function ExperienceCarousel({
  experiences,
  authors,
  photos,
  title,
  seeAllLabel,
  circleLabel,
  onSeeAll,
  onOpenExperience,
}: ExperienceCarouselProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  const contentWidth =
    experiences.length * CARD_WIDTH + Math.max(0, experiences.length - 1) * CARD_GAP;
  const scrollable = Math.max(1, contentWidth - (trackWidth - H_PADDING * 2));
  const travelled = Math.max(0, Math.min(offset, scrollable));

  const thumbRatio =
    trackWidth > 0 ? Math.min(1, (trackWidth - H_PADDING * 2) / contentWidth) : 0.4;
  const thumbWidth = Math.max(28, (trackWidth - H_PADDING * 2) * thumbRatio);
  const thumbShift =
    trackWidth > 0 ? (travelled / scrollable) * (trackWidth - H_PADDING * 2 - thumbWidth) : 0;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setOffset(event.nativeEvent.contentOffset.x);
  };

  return (
    <View className="mt-7">
      <View className="flex-row items-center justify-between px-4">
        <Text className="font-display-semibold text-[18px] text-ink-800">{title}</Text>
        <Pressable onPress={onSeeAll} accessibilityRole="button" className="active:opacity-60">
          <Text className="font-body-semibold text-[12px] text-primary-600">{seeAllLabel}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: CARD_GAP }}
        className="mt-3.5 grow-0">
        {experiences.map((experience) => {
          const author = authors[experience.authorId];

          return (
            <Pressable
              key={experience.id}
              onPress={() => onOpenExperience(experience.id)}
              accessibilityRole="button"
              className="overflow-hidden rounded-card border border-sand-300 bg-paper-50 active:opacity-80"
              style={{ width: CARD_WIDTH }}>
              <ExperiencePhoto source={photos[experience.photo]} />

              <View className="p-3">
                <View className="flex-row items-center gap-2">
                  {author && (
                    <Monogram
                      initials={author.initials}
                      tint={author.tint}
                      size={26}
                      ringColor="#fdfaf4"
                      ringWidth={1.5}
                    />
                  )}
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-body-semibold text-[12px] text-ink-800">
                      {author?.name ?? 'Unknown'}
                    </Text>
                    <Text className="mt-0.5 font-body text-[10px] text-ink-400">
                      {experience.when}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 rounded-pill bg-rose-200 px-2 py-1">
                    <View className="h-1.5 w-1.5 rounded-pill bg-primary-600" />
                    <Text className="font-body-semibold text-[9px] text-primary-700">
                      {circleLabel}
                    </Text>
                  </View>
                </View>

                <View className="mt-2.5 flex-row items-center gap-1.5">
                  <Stars rating={experience.rating} size={11} gap={1.5} />
                  <Text className="font-body-semibold text-[11px] text-ink-700">
                    {experience.rating.toFixed(1)}
                  </Text>
                </View>

                <Text
                  numberOfLines={3}
                  className="mt-2 font-body text-[11px] leading-[17px] text-ink-600">
                  {experience.body}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Proportional scroll indicator — mirrors the design's track and thumb. */}
      <View
        className="mt-3.5 h-1 justify-center"
        style={{ marginHorizontal: H_PADDING }}
        pointerEvents="none">
        <View className="h-1 w-full justify-center rounded-pill bg-sand-400">
          <View
            className="h-1 rounded-pill bg-ink-700"
            style={{ width: thumbWidth, transform: [{ translateX: thumbShift }] }}
          />
        </View>
      </View>
    </View>
  );
}

function ExperiencePhoto({ source }: { source?: ImageSourcePropType }) {
  if (!source) return <View className="h-[132px] bg-surface" />;

  return (
    <Image
      source={source}
      style={{ width: CARD_WIDTH, height: 132 }}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}
