import { Text, View } from 'react-native';

type MonogramProps = {
  initials: string;
  tint: string;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
};

/**
 * Initials disc used instead of remote avatars — deliberately monogram-stamped
 * so the circle reads like a ledger of people rather than a grid of stock faces.
 */
export function Monogram({ initials, tint, size = 32, ringColor, ringWidth = 0 }: MonogramProps) {
  return (
    <View
      className="items-center justify-center rounded-pill"
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        borderWidth: ringWidth,
        borderColor: ringColor ?? tint,
      }}>
      <Text
        style={{
          color: '#fdfaf4',
          fontSize: Math.round(size * 0.36),
          fontWeight: '600',
          letterSpacing: 0.3,
        }}>
        {initials}
      </Text>
    </View>
  );
}
