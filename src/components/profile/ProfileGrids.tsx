import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

import { absoluteUrl, apiBaseUrl } from '@/api/session';
import type { WirePlace } from '@/api/types';
import { Stars } from '@/components/Stars';

const TILE = 168;

type ProfilePlacesProps = {
  places: WirePlace[];
  imageKeys: string[];
  onOpen: (placeId: string) => void;
};

export function ProfilePlacesGrid({ places, imageKeys, onOpen }: ProfilePlacesProps) {
  return (
    <View className="flex-row flex-wrap gap-1 px-2   pl-3">
      {places.map((place, index) => {
        const currentPhotoKey = imageKeys[index];
        return (
          <Pressable
            key={place.id}
            onPress={() => onOpen(place.id)}
            accessibilityRole="button"
            accessibilityLabel={place.name}
            className="mb-4 overflow-hidden rounded-card border border-hairline  active:opacity-80"
            style={{ width: TILE }}>
            <View className="h-[104px] items-center justify-center bg-surface">
              <Image
                source={{ uri: `${apiBaseUrl()}${currentPhotoKey}` }}
                className="h-full w-full"
              />
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
        );
      })}
    </View>
  );
}

type ProfilePhotosProps = {
  /** Relative `/uploads/...` paths straight from the API. */
  urls: string[];
};

const CELL = 104;

/**
 * Photos come from the experiences on file — the API stores no photo gallery,
 * so these are flattened from `experience.photos` by the caller and each tile
 * still belongs to the experience it came from.
 */
export function ProfilePhotosGrid({ urls }: ProfilePhotosProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const resolved = urls.map((url) => absoluteUrl(url)).filter((uri): uri is string => uri !== null);

  return (
    <>
      <View className="flex-row flex-wrap px-6">
        {resolved.map((uri, index) => (
          <Pressable
            // Index, not uri: the same file can legitimately appear twice if two
            // experiences reference it, and the URI alone would collide.
            key={`${uri}-${index}`}
            onPress={() => setOpenIndex(index)}
            accessibilityRole="button"
            accessibilityLabel={`View photo ${index + 1} of ${resolved.length}`}
            className="mb-1 mr-1 overflow-hidden rounded-[8px] active:opacity-80">
            <Image
              source={{ uri }}
              style={{ width: CELL, height: CELL }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          </Pressable>
        ))}
      </View>

      <PhotoViewer
        uri={openIndex === null ? null : resolved[openIndex]}
        index={openIndex}
        total={resolved.length}
        onClose={() => setOpenIndex(null)}
        onStep={(next) => setOpenIndex(next)}
      />
    </>
  );
}

/**
 * Full-screen photo viewer. Deliberately not a carousel: without a gesture
 * handler wired up, a swipe would either do nothing or fight the tap-to-close,
 * so it steps with explicit controls that are reachable by screen reader too.
 */
function PhotoViewer({
  uri,
  index,
  total,
  onClose,
  onStep,
}: {
  uri: string | null;
  index: number | null;
  total: number;
  onClose: () => void;
  onStep: (index: number) => void;
}) {
  if (uri === null || index === null) return null;

  const go = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < total) onStep(next);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close photo"
        className="flex-1 items-center justify-center bg-black/95 px-5">
        <Pressable onPress={() => {}} className="w-full flex-1 items-center justify-center">
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '70%' }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel={`Photo ${index + 1} of ${total}`}
          />
        </Pressable>

        <View className="mb-10 flex-row items-center gap-6">
          <Pressable
            onPress={() => go(-1)}
            disabled={index === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous photo"
            className="h-11 w-11 items-center justify-center rounded-pill bg-white/10 active:opacity-70">
            <MaterialCommunityIcons name="chevron-left" size={24} color="#ffffff" />
          </Pressable>

          <Text className="font-body text-[13px] text-white/80">
            {index + 1} / {total}
          </Text>

          <Pressable
            onPress={() => go(1)}
            disabled={index === total - 1}
            accessibilityRole="button"
            accessibilityLabel="Next photo"
            className="h-11 w-11 items-center justify-center rounded-pill bg-white/10 active:opacity-70">
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
