import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { WirePlace } from '@/api/types';
import { tintForId } from '@/components/Avatar';
import { Monogram } from '@/components/Monogram';

function initialsFor(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

type PinMarkerProps = {
  place: WirePlace;
  selected: boolean;
  onPress: (id: string) => void;
};

/**
 * The pin is a ringed disc centred on its coordinate; the selected pin grows,
 * gains a drop shadow, and grows a nameplate below it. The outer view is pinned
 * to the disc's exact footprint so the label never shifts the geography.
 *
 * The disc shows the place's `coverPhoto` when it has one, and the derived
 * monogram otherwise. The monogram is not a placeholder here — it is the real
 * state for a place with no visible photo, which is common: the server derives
 * `coverPhoto` from the newest experience *this viewer* may see, so an
 * experience-free place, or one whose only photos belong to others, arrives
 * with `coverPhoto: null`.
 */
export function PinMarker({ place, selected, onPress }: PinMarkerProps) {
  const disc = selected ? 52 : 40;
  const ringWidth = selected ? 3 : 2;
  const ringColor = selected ? '#a03246' : '#e0d2b4';

  const uri = absoluteUrl(place.coverPhoto);
  // A broken or unreachable cover must not leave a blank hole on the map, so a
  // failed load falls back to the monogram permanently rather than per-render.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = uri !== null && !imageFailed;

  return (
    <View style={{ width: disc, height: disc }}>
      <Pressable
        onPress={() => onPress(place.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={place.name}
        style={{
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: '#fdfaf4',
          borderWidth: ringWidth,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#1c1815',
          shadowOpacity: selected ? 0.28 : 0.14,
          shadowRadius: selected ? 10 : 5,
          shadowOffset: { width: 0, height: selected ? 4 : 2 },
          elevation: selected ? 6 : 2,
        }}>
        {showImage ? (
          <Image
            source={{ uri }}
            // The disc is bordered, so the image must fill the inner box to sit
            // flush against the ring without covering it.
            style={{ width: disc - ringWidth * 2, height: disc - ringWidth * 2 }}
            borderRadius={(disc - ringWidth * 2) / 2}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Monogram
            initials={initialsFor(place.name)}
            tint={tintForId(place.id)}
            size={disc - 10}
          />
        )}
      </Pressable>

      {/* Nameplate for the selected place. */}
      {selected && (
        <View className="absolute items-center" style={{ top: disc + 7, left: -60, width: 160 }}>
          <View className="rounded-pill bg-primary-600 px-3 py-1">
            <Text numberOfLines={1} className="font-body-semibold text-[11px] text-primary-fg">
              {place.name}
            </Text>
          </View>
          <View
            className="absolute -top-1 h-2 w-2 rotate-45 bg-primary-600"
            style={{ alignSelf: 'center' }}
          />
        </View>
      )}
    </View>
  );
}
