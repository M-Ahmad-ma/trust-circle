import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const FILLED = '#de9a34';
const EMPTY = '#e0d2b4';

function Star({ size, color }: { size: number; color: string }) {
  const c = size / 2;
  const outer = size / 2;
  const inner = outer * 0.44;

  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${(c + r * Math.cos(angle)).toFixed(2)},${(c + r * Math.sin(angle)).toFixed(2)}`;
  }).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={points} fill={color} />
    </Svg>
  );
}

type StarsProps = {
  rating: number;
  size?: number;
  gap?: number;
};

/** Five stars with a fractional final star — brass, the conventional rating colour. */
export function Stars({ rating, size = 13, gap = 2 }: StarsProps) {
  return (
    <View className="flex-row items-center" style={{ gap }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Star size={size} color={EMPTY} />
            {fill > 0 && (
              <View style={{ width: size * fill, height: size, overflow: 'hidden' }}>
                <Star size={size} color={FILLED} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
