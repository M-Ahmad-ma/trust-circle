import { Text, View } from 'react-native';

import type { Member } from '@/types';
import { Monogram } from './Monogram';

type MonogramStackProps = {
  people: Member[];
  size?: number;
  max?: number;
  ringColor?: string;
};

/** Overlapping discs with a paper ring so each face stays legible in the stack. */
export function MonogramStack({
  people,
  size = 26,
  max = 4,
  ringColor = '#fdfaf4',
}: MonogramStackProps) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const overlap = Math.round(size * 0.3);

  return (
    <View className="flex-row items-center">
      {shown.map((person, index) => (
        <View key={person.id} style={{ marginLeft: index === 0 ? 0 : -overlap }}>
          <Monogram
            initials={person.initials}
            tint={person.tint}
            size={size}
            ringColor={ringColor}
            ringWidth={2}
          />
        </View>
      ))}
      {extra > 0 && (
        <View
          className="items-center justify-center rounded-pill bg-ink-800"
          style={{
            width: size,
            height: size,
            marginLeft: -overlap,
            borderWidth: 2,
            borderColor: ringColor,
          }}>
          <Text style={{ color: '#fdfaf4', fontSize: size * 0.32, fontWeight: '700' }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}
