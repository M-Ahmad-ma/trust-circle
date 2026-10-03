import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { Place } from '@/types';
import { Monogram } from './Monogram';

const PALETTE = ['#8e2c39', '#4a6b52', '#c08a2e', '#6e5a86', '#a06c22', '#6e1f2a'];

function initialsFor(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function tintFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

type PinMarkerProps = {
  place: Place;
  selected: boolean;
  onPress: (id: string) => void;
};

/**
 * The pin is a ringed monogram disc centred on its coordinate; the selected pin
 * grows, gains a drop shadow, and grows a nameplate below it. The outer view is
 * pinned to the disc's exact footprint so the label never shifts the geography.
 */
export function PinMarker({ place, selected, onPress }: PinMarkerProps) {
  const disc = selected ? 52 : 40;
  const ringWidth = selected ? 3 : 2;
  const ringColor = selected ? '#8e2c39' : '#e0d2b4';

  return (
    <View style={{ width: disc, height: disc }}>
      <Pressable
        onPress={() => onPress(place.id)}
        hitSlop={8}
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
        <Monogram initials={initialsFor(place.name)} tint={tintFor(place.id)} size={disc - 10} />
      </Pressable>

      {place.seal && (
        <View
          className="absolute items-center justify-center rounded-pill bg-accent-500"
          style={{
            width: 16,
            height: 16,
            right: -3,
            bottom: -3,
            borderWidth: 2,
            borderColor: '#fdfaf4',
          }}>
          <MaterialCommunityIcons name="check" size={9} color="#0e0c0a" />
        </View>
      )}

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
