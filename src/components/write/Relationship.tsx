import { Pressable, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Stars } from '@/components/Stars';
import { relationshipFor, type Visibility } from '@/theme/relationship';

const FILLED = '#de9a34';
const EMPTY = '#e0d2b4';

function Star({ size, color }: { size: number; color: string }) {
  const c = size / 2;
  const inner = c * 0.44;

  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? c : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(c + r * Math.cos(angle)).toFixed(2)},${(c + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}

type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
};

/**
 * Tappable stars. Tapping the current value clears it, because committing to a
 * rating you cannot take back is worse than being able to change your mind.
 */
export function StarRatingInput({ value, onChange, size = 44 }: StarRatingInputProps) {
  return (
    <View className="flex-row" style={{ gap: 10 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(value === star ? 0 : star)}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          accessibilityState={{ selected: value >= star }}
          hitSlop={6}
          style={{ padding: 8 }}
          className="active:opacity-60">
          <Star size={size} color={value >= star ? FILLED : EMPTY} />
        </Pressable>
      ))}
    </View>
  );
}

type RelationshipBadgeProps = {
  visibility: Visibility;
  compact?: boolean;
  size?: 'sm' | 'md';
};

/**
 * README §7 — proximity, not quality. The label always accompanies the colour so
 * the meaning never rests on hue alone.
 */
export function RelationshipBadge({ visibility, compact, size = 'md' }: RelationshipBadgeProps) {
  const level = relationshipFor(visibility);

  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-pill px-2.5 py-1"
      style={{ backgroundColor: level.wash }}>
      <View
        style={{
          width: size === 'sm' ? 5 : 6,
          height: size === 'sm' ? 5 : 6,
          borderRadius: 3,
          backgroundColor: level.color,
        }}
      />
      <Text
        className="font-body-semibold"
        style={{ fontSize: size === 'sm' ? 9 : 10.5, color: level.color }}>
        {compact ? level.short : level.label}
      </Text>
    </View>
  );
}

export { Stars };
